import type { Entity, Command } from './types';
import { MPA_SPECS } from './types';
import { distanceMeters, bearingDegrees, movePosition } from './geo';

/** Minimum distance to destination to consider "arrived" (meters) */
const ARRIVAL_THRESHOLD = 500;

/** Apply a command to an entity */
export function applyCommand(entity: Entity, command: Command): Entity {
  switch (command.type) {
    case 'MOVE':
      return {
        ...entity,
        destination: command.target,
        state: 'TRANSIT',
        velocity: {
          heading: bearingDegrees(entity.position, command.target),
          speed: MPA_SPECS.cruiseSpeed,
        },
      };
  }
}

/** Update a single entity for one simulation tick */
export function updateEntity(entity: Entity, gameDelta: number): Entity {
  if (entity.destination === null || entity.velocity.speed === 0) {
    return entity;
  }

  const dist = distanceMeters(entity.position, entity.destination);

  // Check if we've arrived
  if (dist < ARRIVAL_THRESHOLD) {
    return {
      ...entity,
      position: entity.destination,
      destination: null,
      velocity: { ...entity.velocity, speed: 0 },
      state: 'IDLE',
    };
  }

  // Move toward destination
  const moveDistance = entity.velocity.speed * gameDelta;

  // Don't overshoot
  const actualDistance = Math.min(moveDistance, dist);
  const heading = bearingDegrees(entity.position, entity.destination);
  const newPosition = movePosition(entity.position, heading, actualDistance);

  // Consume fuel
  const newFuel = Math.max(0, entity.fuel - gameDelta);

  return {
    ...entity,
    position: newPosition,
    velocity: { ...entity.velocity, heading },
    fuel: newFuel,
  };
}

/** Update all entities in the game */
export function updateEntities(entities: Map<string, Entity>, gameDelta: number): Map<string, Entity> {
  const updated = new Map<string, Entity>();
  for (const [id, entity] of entities) {
    updated.set(id, updateEntity(entity, gameDelta));
  }
  return updated;
}
