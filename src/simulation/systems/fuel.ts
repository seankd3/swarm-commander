// --- Fuel System ---
// Burns fuel for airborne entities. Triggers bingo state.
// Entities with fuel=0 while airborne are destroyed (crash).

import type { Entity, EntityId, Task, TaskParams, GameState } from '../types';
import { getPlatform } from '../../platforms/platform-registry';
import { distanceMeters } from '../geo';

/** Burn fuel for a single entity based on current speed */
function burnFuel(entity: Entity, gameDelta: number): Entity {
  if (!entity.fuelState) return entity;
  if (entity.flightState !== 'AIRBORNE' && entity.flightState !== 'LAUNCHING') return entity;
  if (entity.state === 'DESTROYED') return entity;

  const def = getPlatform(entity.platformId);
  if (!def.fuel || !def.movement) return entity;

  // Interpolate burn rate based on speed fraction
  const speedFraction = def.movement.maxSpeed > 0
    ? entity.velocity.speed / def.movement.maxSpeed
    : 0;
  const burnRate = def.fuel.burnRateCruise +
    (def.fuel.burnRateMax - def.fuel.burnRateCruise) * speedFraction;

  const consumed = burnRate * gameDelta;
  const remaining = Math.max(0, entity.fuelState.remaining - consumed);
  const isBingo = remaining <= entity.fuelState.capacity * def.fuel.bingoPercent;

  // Fuel exhaustion while airborne = crash
  if (remaining <= 0 && entity.flightState === 'AIRBORNE') {
    return {
      ...entity,
      state: 'DESTROYED',
      health: 0,
      fuelState: { ...entity.fuelState, remaining: 0, isBingo: true },
    };
  }

  return {
    ...entity,
    fuelState: { ...entity.fuelState, remaining, isBingo },
  };
}

/** Find nearest base entity for RTB */
function findNearestBase(entity: Entity, entities: Map<EntityId, Entity>): EntityId | null {
  let bestId: EntityId | null = null;
  let bestDist = Infinity;

  for (const [id, other] of entities) {
    if (other.faction !== entity.faction) continue;
    if (other.state === 'DESTROYED') continue;
    const plat = getPlatform(other.platformId);
    if (!plat.base) continue;

    const dist = distanceMeters(entity.position, other.position);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = id;
    }
  }

  return bestId;
}

/** Check if entity already has RTB/LAND tasks queued */
function hasRtbQueued(entity: Entity, tasks: Task[]): boolean {
  const allTaskIds = [entity.currentTaskId, ...entity.taskQueue].filter(Boolean) as string[];
  for (const taskId of allTaskIds) {
    const task = tasks.find(t => t.id === taskId);
    if (task && (task.type === 'RTB' || task.type === 'LAND')) return true;
  }
  return false;
}

/** Auto-inject RTB + LAND tasks for bingo entities */
export function injectBingoRtb(state: GameState): GameState {
  let entities = new Map(state.entities);
  const tasks = [...state.tasks];
  let changed = false;

  for (const [id, entity] of entities) {
    if (!entity.fuelState?.isBingo) continue;
    if (entity.flightState !== 'AIRBORNE') continue;
    if (entity.state === 'DESTROYED') continue;
    if (hasRtbQueued(entity, tasks)) continue;

    const baseId = entity.homeBaseId ?? findNearestBase(entity, entities);
    if (!baseId) continue;

    // Create RTB task
    const rtbTaskId = `auto-rtb-${id}-${state.time.elapsed}`;
    const landTaskId = `auto-land-${id}-${state.time.elapsed}`;

    const defaultParams: TaskParams = {
      roe: 'WEAPONS_HOLD',
      formation: 'NONE',
      spacing: 0,
      speedFraction: 0.8,
      radarMode: 'ACTIVE',
    };

    tasks.push({
      type: 'RTB',
      id: rtbTaskId,
      assignedIds: [id],
      status: 'ACTIVE',
      completionCondition: { type: 'ARRIVAL' },
      createdAt: state.time.elapsed,
      activatedAt: state.time.elapsed,
      params: defaultParams,
      baseId,
    });

    tasks.push({
      type: 'LAND',
      id: landTaskId,
      assignedIds: [id],
      status: 'QUEUED',
      completionCondition: { type: 'FLIGHT_STATE', target: 'PARKED' },
      createdAt: state.time.elapsed,
      activatedAt: null,
      params: { ...defaultParams, speedFraction: 0.5 },
      baseId,
    });

    // Inject at front of queue, replacing current task
    entities.set(id, {
      ...entity,
      currentTaskId: rtbTaskId,
      taskQueue: [landTaskId, ...entity.taskQueue],
    });
    changed = true;
  }

  if (!changed) return state;
  return { ...state, entities, tasks };
}

/** Run fuel burn for all entities */
export function runFuelSystem(
  entities: Map<EntityId, Entity>,
  gameDelta: number,
): Map<EntityId, Entity> {
  const updated = new Map<EntityId, Entity>();
  for (const [id, entity] of entities) {
    updated.set(id, burnFuel(entity, gameDelta));
  }
  return updated;
}
