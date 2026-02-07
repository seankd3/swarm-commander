// --- Movement System ---
// Moves entities toward their destination. Pure function.

import type { Entity, EntityId } from '../types';
import { distanceMeters, bearingDegrees, movePosition, normalizeHeading } from '../geo';

const ARRIVAL_THRESHOLD = 200; // meters

/** Update radar/sensor rotation */
function updateSensorRotation(entity: Entity, gameDelta: number): Entity {
  if (!entity.sensor || entity.sensor.rotationSpeed === 0) {
    return entity;
  }

  const newAngle = normalizeHeading(
    entity.sensor.currentAngle + entity.sensor.rotationSpeed * gameDelta
  );

  return {
    ...entity,
    sensor: { ...entity.sensor, currentAngle: newAngle },
  };
}

const ORBIT_RADIUS = 2000; // meters — default holding pattern radius
const ORBIT_ANGULAR_SPEED = 2; // degrees per second (slow lazy orbit)

/** Move entity toward its destination */
function moveToward(entity: Entity, gameDelta: number): Entity {
  if (entity.destination === null && entity.velocity.speed === 0) {
    return entity;
  }

  // Airborne aircraft with no destination: fly a holding orbit to avoid stopping mid-air
  if (entity.destination === null && isAirborne(entity)) {
    return flyHoldingPattern(entity, gameDelta);
  }

  if (entity.destination === null) {
    return entity;
  }

  const dist = distanceMeters(entity.position, entity.destination);

  if (dist < ARRIVAL_THRESHOLD) {
    // Airborne aircraft: mark IDLE but keep cruising (holding pattern will kick in next tick)
    if (isAirborne(entity)) {
      return {
        ...entity,
        position: entity.destination,
        destination: null,
        state: 'IDLE',
        // Keep speed — don't stop in mid-air
      };
    }
    // Ground units / parked aircraft: full stop
    return {
      ...entity,
      position: entity.destination,
      destination: null,
      velocity: { ...entity.velocity, speed: 0 },
      state: 'IDLE',
    };
  }

  const moveDistance = entity.velocity.speed * gameDelta;
  const actualDistance = Math.min(moveDistance, dist);
  const heading = bearingDegrees(entity.position, entity.destination);
  const newPosition = movePosition(entity.position, heading, actualDistance);

  return {
    ...entity,
    position: newPosition,
    heading,
    velocity: { ...entity.velocity, heading },
  };
}

/** Check if an entity is in an airborne flight state */
function isAirborne(entity: Entity): boolean {
  return entity.flightState === 'AIRBORNE' || entity.flightState === 'LAUNCHING';
}

/** Fly a holding pattern (clockwise circle) when idle in the air */
function flyHoldingPattern(entity: Entity, gameDelta: number): Entity {
  // Maintain minimum cruise speed
  const cruiseSpeed = entity.maxSpeed * 0.5;
  const speed = Math.max(entity.velocity.speed, cruiseSpeed);

  // Turn gently clockwise to create a holding circle
  const turnRate = ORBIT_ANGULAR_SPEED * gameDelta * 360 / (2 * Math.PI * ORBIT_RADIUS / speed);
  const newHeading = normalizeHeading(entity.heading + Math.min(turnRate, 3));

  const moveDistance = speed * gameDelta;
  const newPosition = movePosition(entity.position, newHeading, moveDistance);

  return {
    ...entity,
    position: newPosition,
    heading: newHeading,
    velocity: { heading: newHeading, speed },
    state: 'IDLE', // still IDLE so task executor can assign new work
  };
}

/** Update movement + sensor rotation for a single entity */
export function updateMovement(entity: Entity, gameDelta: number): Entity {
  if (entity.flightState === 'PARKED') return entity; // parked aircraft don't move
  if (entity.state === 'DESTROYED' || entity.state === 'ATTACKING') {
    // Still rotate sensors even when attacking
    return updateSensorRotation(entity, gameDelta);
  }

  let updated = updateSensorRotation(entity, gameDelta);
  updated = moveToward(updated, gameDelta);
  return updated;
}

/** Run movement for all entities */
export function runMovementSystem(
  entities: Map<EntityId, Entity>,
  gameDelta: number,
): Map<EntityId, Entity> {
  const updated = new Map<EntityId, Entity>();
  for (const [id, entity] of entities) {
    updated.set(id, updateMovement(entity, gameDelta));
  }
  return updated;
}
