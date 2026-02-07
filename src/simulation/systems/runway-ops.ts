// --- Runway Operations ---
// Manages runway-aligned takeoff and landing animations.
// Module-local state avoids touching the shared Entity interface.

import type { Entity, EntityId, Position } from '../types';
import { getPlatform } from '../../platforms/platform-registry';
import {
  getPrimaryRunway,
  getDepartureThreshold,
  getArrivalThreshold,
  getDepartureHeading,
  getLandingHeading,
  runwayLength,
  getApproachPoint,
} from '../../data/airbase-runways';
import { distanceMeters, movePosition } from '../geo';

// --- Runway Phase State (module-local, not on Entity) ---

export type TakeoffPhase = 'TAKEOFF_ROLL' | 'ROTATE' | 'DEPARTURE_CLIMB';
export type LandingPhase = 'APPROACH_ALIGN' | 'FINAL_APPROACH' | 'LANDING_ROLL';
export type RunwayPhase = TakeoffPhase | LandingPhase;

interface RunwayState {
  phase: RunwayPhase;
  baseId: EntityId;
  progressMeters: number;  // distance along runway from start threshold
  runwayLengthM: number;
}

// Module-local runway state per aircraft
const runwayStates = new Map<EntityId, RunwayState>();

// --- Constants ---

const ROTATE_FRACTION = 0.7;        // rotate at 70% of runway length
const DEPARTURE_CLIMB_DIST = 2000;  // meters past runway end before turning to mission
const APPROACH_DIST = 2500;         // meters out from threshold for approach alignment
const FINAL_APPROACH_DIST = 2500;   // within this distance, start final approach
const LANDING_THRESHOLD_DIST = 50;  // meters from threshold to transition to landing roll
const LANDING_STOP_FRACTION = 0.6;  // stop at 60% of runway length on landing roll
const LAUNCH_SPEED_FRACTION = 0.8;  // transition to AIRBORNE at 80% cruise

// --- Public Query API (for renderer) ---

export function getRunwayState(entityId: EntityId): RunwayState | null {
  return runwayStates.get(entityId) ?? null;
}

export function isRunwayOccupied(baseId: EntityId): boolean {
  for (const state of runwayStates.values()) {
    if (state.baseId === baseId) {
      const phase = state.phase;
      if (phase === 'TAKEOFF_ROLL' || phase === 'ROTATE' || phase === 'LANDING_ROLL') {
        return true;
      }
    }
  }
  return false;
}

/** Clear runway state for a destroyed/removed entity */
export function clearRunwayState(entityId: EntityId): void {
  runwayStates.delete(entityId);
}

// --- Launch Queue Processing ---

/** Process base launch queues: pop one aircraft per launchInterval when runway is clear.
 *  Returns entity updates (aircraft transitioning from PARKED to LAUNCHING). */
export function processLaunchQueue(
  baseEntity: Entity,
  allEntities: Map<EntityId, Entity>,
  gameTime: number,
): Map<EntityId, Partial<Entity>> | null {
  if (!baseEntity.baseState) return null;
  if (baseEntity.baseState.launchQueue.length === 0) return null;

  const plat = getPlatform(baseEntity.platformId);
  if (!plat.base) return null;

  const runway = getPrimaryRunway(baseEntity.id);
  if (!runway) return null;

  // Check timing
  const timeSinceLastLaunch = gameTime - baseEntity.baseState.lastLaunchTime;
  if (timeSinceLastLaunch < plat.base.launchInterval) return null;

  // Check runway clear
  if (isRunwayOccupied(baseEntity.id)) return null;

  // Pop next aircraft from queue
  const nextId = baseEntity.baseState.launchQueue[0];
  const aircraft = allEntities.get(nextId);
  if (!aircraft || aircraft.state === 'DESTROYED' || aircraft.flightState !== 'PARKED') {
    // Invalid queue entry — remove it
    return new Map([[baseEntity.id, {
      baseState: {
        ...baseEntity.baseState,
        launchQueue: baseEntity.baseState.launchQueue.slice(1),
      },
    } as Partial<Entity>]]);
  }

  const depThreshold = getDepartureThreshold(runway);
  const depHeading = getDepartureHeading(runway);
  const rwyLen = runwayLength(runway);

  // Set up runway state
  runwayStates.set(nextId, {
    phase: 'TAKEOFF_ROLL',
    baseId: baseEntity.id,
    progressMeters: 0,
    runwayLengthM: rwyLen,
  });

  // Point destination far along the departure heading so movement system agrees with direction
  const farPoint = movePosition(depThreshold, depHeading, rwyLen + 5000);

  const updates = new Map<EntityId, Partial<Entity>>();

  // Update aircraft
  updates.set(nextId, {
    flightState: 'LAUNCHING',
    state: 'TRANSIT',
    homeBaseId: baseEntity.id,
    position: { ...depThreshold },
    heading: depHeading,
    velocity: { heading: depHeading, speed: 1 },
    destination: farPoint,
  } as Partial<Entity>);

  // Update base state
  updates.set(baseEntity.id, {
    baseState: {
      ...baseEntity.baseState,
      launchQueue: baseEntity.baseState.launchQueue.slice(1),
      lastLaunchTime: gameTime,
    },
  } as Partial<Entity>);

  return updates;
}

// --- Takeoff Processing ---

/** Process runway takeoff for a LAUNCHING aircraft.
 *  Returns updated entity fields, or null if this aircraft has no runway state. */
export function processRunwayLaunch(
  entity: Entity,
  gameDelta: number,
): Partial<Entity> | null {
  if (entity.flightState !== 'LAUNCHING') return null;

  const rwyState = runwayStates.get(entity.id);
  if (!rwyState) return null;

  const runway = getPrimaryRunway(rwyState.baseId);
  if (!runway) {
    runwayStates.delete(entity.id);
    return null;
  }

  const def = getPlatform(entity.platformId);
  if (!def.movement) return null;

  const depThreshold = getDepartureThreshold(runway);
  const depHeading = getDepartureHeading(runway);
  const rwyLen = rwyState.runwayLengthM;

  // Accelerate
  const newSpeed = Math.min(
    entity.velocity.speed + def.movement.acceleration * gameDelta,
    def.movement.cruiseSpeed,
  );
  const distanceMoved = newSpeed * gameDelta;
  const newProgress = rwyState.progressMeters + distanceMoved;

  // Position along runway centerline
  const newPosition = movePosition(depThreshold, depHeading, newProgress);

  // Phase transitions
  let newPhase = rwyState.phase;
  if (rwyState.phase === 'TAKEOFF_ROLL' && newProgress >= rwyLen * ROTATE_FRACTION) {
    newPhase = 'ROTATE';
  }
  if ((rwyState.phase === 'ROTATE' || rwyState.phase === 'TAKEOFF_ROLL') && newProgress >= rwyLen) {
    newPhase = 'DEPARTURE_CLIMB';
  }

  // Departure climb: continue straight past runway end
  if (newPhase === 'DEPARTURE_CLIMB') {
    const pastEnd = newProgress - rwyLen;
    const targetSpeed = def.movement.cruiseSpeed * LAUNCH_SPEED_FRACTION;

    if (pastEnd >= DEPARTURE_CLIMB_DIST && newSpeed >= targetSpeed) {
      // Transition to AIRBORNE — delete runway state
      runwayStates.delete(entity.id);
      return {
        flightState: 'AIRBORNE',
        state: 'IDLE',
        position: newPosition,
        heading: depHeading,
        velocity: { heading: depHeading, speed: newSpeed },
        destination: null,
      };
    }
  }

  // Update runway state
  runwayStates.set(entity.id, { ...rwyState, phase: newPhase, progressMeters: newProgress });

  return {
    position: newPosition,
    heading: depHeading,
    velocity: { heading: depHeading, speed: newSpeed },
  };
}

// --- Landing Processing ---

/** Initiate runway landing. Call from task-executor when LAND task activates.
 *  Returns approach destination + heading, or null if base has no runway. */
export function initiateLandingOnRunway(
  entityId: EntityId,
  baseId: EntityId,
): { destination: Position; heading: number } | null {
  const runway = getPrimaryRunway(baseId);
  if (!runway) return null;

  const rwyLen = runwayLength(runway);
  const approachPoint = getApproachPoint(runway, APPROACH_DIST);
  const landingHdg = getLandingHeading(runway);

  runwayStates.set(entityId, {
    phase: 'APPROACH_ALIGN',
    baseId,
    progressMeters: 0,
    runwayLengthM: rwyLen,
  });

  return { destination: approachPoint, heading: landingHdg };
}

/** Process runway recovery for a RECOVERING aircraft.
 *  Returns updated entity fields, or null if no runway state. */
export function processRunwayRecovery(
  entity: Entity,
  base: Entity,
  gameDelta: number,
): Partial<Entity> | null {
  if (entity.flightState !== 'RECOVERING') return null;

  const rwyState = runwayStates.get(entity.id);
  if (!rwyState) return null;

  const runway = getPrimaryRunway(rwyState.baseId);
  if (!runway) {
    runwayStates.delete(entity.id);
    return null;
  }

  const arrivalThreshold = getArrivalThreshold(runway);
  const landingHdg = getLandingHeading(runway);
  const depHeading = getDepartureHeading(runway);
  const rwyLen = rwyState.runwayLengthM;

  const def = getPlatform(entity.platformId);
  const cruiseSpeed = def.movement?.cruiseSpeed ?? 60;

  switch (rwyState.phase) {
    case 'APPROACH_ALIGN': {
      // Movement system is flying us toward the approach point.
      // Check if we're close enough to transition to final approach.
      const distToThreshold = distanceMeters(entity.position, arrivalThreshold);
      if (distToThreshold < FINAL_APPROACH_DIST) {
        runwayStates.set(entity.id, { ...rwyState, phase: 'FINAL_APPROACH' });
        return {
          destination: { ...arrivalThreshold },
          heading: landingHdg,
          velocity: { heading: landingHdg, speed: Math.min(entity.velocity.speed, cruiseSpeed * 0.5) },
        };
      }
      // Keep heading constrained to landing heading
      return {
        heading: landingHdg,
        velocity: { ...entity.velocity, heading: landingHdg },
      };
    }

    case 'FINAL_APPROACH': {
      // Decelerate toward threshold
      const distToThreshold = distanceMeters(entity.position, arrivalThreshold);
      const approachSpeed = Math.max(15, (distToThreshold / 1000) * cruiseSpeed * 0.3);
      const currentSpeed = Math.min(entity.velocity.speed, approachSpeed);

      // Move toward threshold
      const moveDistance = currentSpeed * gameDelta;
      const newPosition = movePosition(entity.position, landingHdg, Math.min(moveDistance, distToThreshold));

      if (distToThreshold < LANDING_THRESHOLD_DIST) {
        // Touchdown — transition to landing roll
        runwayStates.set(entity.id, { ...rwyState, phase: 'LANDING_ROLL', progressMeters: 0 });
        return {
          position: { ...arrivalThreshold },
          heading: landingHdg,
          velocity: { heading: landingHdg, speed: currentSpeed },
          destination: movePosition(arrivalThreshold, landingHdg, rwyLen),
        };
      }

      return {
        position: newPosition,
        heading: landingHdg,
        velocity: { heading: landingHdg, speed: currentSpeed },
      };
    }

    case 'LANDING_ROLL': {
      // Decelerate along runway from arrival threshold
      const decelRate = cruiseSpeed * 0.8; // lose speed quickly
      const newSpeed = Math.max(0, entity.velocity.speed - decelRate * gameDelta);
      const distanceMoved = newSpeed * gameDelta;
      const newProgress = rwyState.progressMeters + distanceMoved;

      // Position along runway from arrival threshold toward departure end
      // Landing roll goes in the departure heading direction (same as takeoff direction)
      const newPosition = movePosition(arrivalThreshold, depHeading, newProgress);

      if (newSpeed <= 1 || newProgress >= rwyLen * LANDING_STOP_FRACTION) {
        // Stopped — snap to base position, PARKED
        runwayStates.delete(entity.id);
        return {
          flightState: 'PARKED',
          state: 'IDLE',
          position: { ...base.position },
          velocity: { heading: entity.heading, speed: 0 },
          destination: null,
        };
      }

      runwayStates.set(entity.id, { ...rwyState, progressMeters: newProgress });

      return {
        position: newPosition,
        heading: landingHdg,
        velocity: { heading: landingHdg, speed: newSpeed },
      };
    }

    default:
      return null;
  }
}

/** Get the base state for the launch queue indicator (countdown info). */
export function getLaunchQueueInfo(baseEntity: Entity, gameTime: number): {
  queueLength: number;
  countdown: number;
} | null {
  if (!baseEntity.baseState) return null;
  if (baseEntity.baseState.launchQueue.length === 0) return null;

  const plat = getPlatform(baseEntity.platformId);
  if (!plat.base) return null;

  const elapsed = gameTime - baseEntity.baseState.lastLaunchTime;
  const remaining = Math.max(0, plat.base.launchInterval - elapsed);

  return {
    queueLength: baseEntity.baseState.launchQueue.length,
    countdown: Math.ceil(remaining),
  };
}
