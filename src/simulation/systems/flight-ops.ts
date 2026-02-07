// --- Flight Ops System ---
// Manages flight state machine: PARKED → LAUNCHING → AIRBORNE → RECOVERING → PARKED
// Handles base launch queues and recovery slots.

import type { Entity, EntityId } from '../types';
import { getPlatform } from '../../platforms/platform-registry';
import { distanceMeters } from '../geo';
import {
  processRunwayLaunch,
  processRunwayRecovery,
  processLaunchQueue,
  clearRunwayState,
} from './runway-ops';

const LAUNCH_COMPLETE_SPEED_FRACTION = 0.8; // transition to AIRBORNE when at 80% cruise
const RECOVERY_THRESHOLD = 300; // meters from base to complete landing

/** Process LAUNCHING state: accelerate until cruise speed, then → AIRBORNE */
function processLaunching(entity: Entity, gameDelta: number): Entity {
  if (entity.flightState !== 'LAUNCHING') return entity;

  // Delegate to runway ops if this aircraft has runway state
  const runwayUpdate = processRunwayLaunch(entity, gameDelta);
  if (runwayUpdate) return { ...entity, ...runwayUpdate };

  // Fallback: no runway data — original acceleration logic
  const def = getPlatform(entity.platformId);
  if (!def.movement) return entity;

  const targetSpeed = def.movement.cruiseSpeed * LAUNCH_COMPLETE_SPEED_FRACTION;
  const newSpeed = Math.min(
    entity.velocity.speed + (def.movement.acceleration * gameDelta),
    def.movement.cruiseSpeed,
  );

  const updated: Entity = {
    ...entity,
    velocity: { ...entity.velocity, speed: newSpeed },
  };

  if (newSpeed >= targetSpeed) {
    return {
      ...updated,
      flightState: 'AIRBORNE',
      state: 'IDLE',
    };
  }

  return updated;
}

/** Process RECOVERING state: decelerate toward base, on arrival → PARKED */
function processRecovering(entity: Entity, entities: Map<EntityId, Entity>, gameDelta: number): Entity {
  if (entity.flightState !== 'RECOVERING') return entity;
  if (!entity.homeBaseId) return entity;

  const base = entities.get(entity.homeBaseId);
  if (!base) return entity;

  // Delegate to runway ops if this aircraft has runway state
  const runwayUpdate = processRunwayRecovery(entity, base, gameDelta);
  if (runwayUpdate) return { ...entity, ...runwayUpdate };

  // Fallback: no runway data — original recovery logic
  const dist = distanceMeters(entity.position, base.position);

  if (dist < RECOVERY_THRESHOLD) {
    return {
      ...entity,
      flightState: 'PARKED',
      state: 'IDLE',
      position: { ...base.position },
      velocity: { heading: entity.heading, speed: 0 },
      destination: null,
    };
  }

  // Decelerate as we approach
  const def = getPlatform(entity.platformId);
  const decelSpeed = Math.max(10, (dist / 1000) * (def.movement?.cruiseSpeed ?? 30));
  const currentSpeed = Math.min(entity.velocity.speed, decelSpeed);

  return {
    ...entity,
    velocity: { ...entity.velocity, speed: currentSpeed },
  };
}

/** Update base state: track parked aircraft counts */
function updateBaseState(entity: Entity, allEntities: Map<EntityId, Entity>): Entity {
  if (!entity.baseState) return entity;

  // Rebuild parked list from all entities claiming this as home
  const parked: EntityId[] = [];
  for (const [id, other] of allEntities) {
    if (other.homeBaseId === entity.id && other.flightState === 'PARKED') {
      parked.push(id);
    }
  }

  if (arraysEqual(parked, entity.baseState.parkedAircraft)) return entity;

  return {
    ...entity,
    baseState: { ...entity.baseState, parkedAircraft: parked },
  };
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/** Run flight ops for all entities */
export function runFlightOpsSystem(
  entities: Map<EntityId, Entity>,
  gameDelta: number,
  gameTime: number,
): Map<EntityId, Entity> {
  const updated = new Map<EntityId, Entity>();

  // Pre-pass: process base launch queues and clear runway state for destroyed entities
  for (const [id, entity] of entities) {
    if (entity.state === 'DESTROYED') {
      clearRunwayState(id);
      continue;
    }
    if (entity.baseState) {
      const queueUpdates = processLaunchQueue(entity, entities, gameTime);
      if (queueUpdates) {
        for (const [uid, partial] of queueUpdates) {
          const existing = entities.get(uid);
          if (existing) {
            updated.set(uid, { ...existing, ...partial } as Entity);
          }
        }
      }
    }
  }

  // First pass: process flight states
  for (const [id, entity] of entities) {
    // Skip if already processed in pre-pass
    if (updated.has(id)) {
      const e = updated.get(id)!;
      if (e.state === 'DESTROYED') continue;
      let processed = processLaunching(e, gameDelta);
      processed = processRecovering(processed, entities, gameDelta);
      updated.set(id, processed);
      continue;
    }

    if (entity.state === 'DESTROYED') {
      updated.set(id, entity);
      continue;
    }

    let e = processLaunching(entity, gameDelta);
    e = processRecovering(e, entities, gameDelta);
    updated.set(id, e);
  }

  // Second pass: update base states
  const final = new Map<EntityId, Entity>();
  for (const [id, entity] of updated) {
    final.set(id, updateBaseState(entity, updated));
  }

  return final;
}
