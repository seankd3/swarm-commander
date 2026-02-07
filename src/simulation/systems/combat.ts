// --- Combat System ---
// Suicide strike attacks + attack resolution. Pure function.
// Only handles SUICIDE weapon type — cruise missiles and ARMs use the missile system.

import type { Entity, EntityId } from '../types';
import { getPlatform } from '../../platforms/platform-registry';
import { distanceMeters, bearingDegrees, movePosition } from '../geo';

/** Update suicide-strike attack behavior */
function updateAttack(entity: Entity, entities: Map<EntityId, Entity>, gameDelta: number): Entity {
  const platform = getPlatform(entity.platformId);
  if (!platform.weapon || platform.weapon.type !== 'SUICIDE' || entity.state !== 'ATTACKING' || !entity.target) {
    return entity;
  }

  const target = entities.get(entity.target);
  if (!target || target.state === 'DESTROYED') {
    // Lost target — return to cruise speed, not 0 (fixes lost-target bug)
    const cruiseSpeed = platform.movement?.cruiseSpeed ?? 0;
    return {
      ...entity,
      target: null,
      state: 'IDLE',
      velocity: { ...entity.velocity, speed: cruiseSpeed },
    };
  }

  const dist = distanceMeters(entity.position, target.position);
  if (dist < platform.weapon.range) {
    return {
      ...entity,
      state: 'DESTROYED',
      health: 0,
      velocity: { heading: entity.heading, speed: 0 },
    };
  }

  // Move toward target at max speed
  const heading = bearingDegrees(entity.position, target.position);
  const moveDistance = entity.maxSpeed * gameDelta;
  const actualDistance = Math.min(moveDistance, dist);
  const newPosition = movePosition(entity.position, heading, actualDistance);

  return {
    ...entity,
    position: newPosition,
    heading,
    velocity: { heading, speed: entity.maxSpeed },
  };
}

/** Resolve suicide strikes — apply damage to targets */
function resolveAttacks(entities: Map<EntityId, Entity>): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const destroyedStrikers: EntityId[] = [];

  for (const [id, entity] of updated) {
    const plat = getPlatform(entity.platformId);
    if (plat.weapon?.type === 'SUICIDE' && entity.state === 'DESTROYED' && entity.target) {
      destroyedStrikers.push(id);
      const target = updated.get(entity.target);
      if (target && target.state !== 'DESTROYED') {
        updated.set(entity.target, {
          ...target,
          health: 0,
          state: 'DESTROYED',
        });
      }
    }
  }

  for (const id of destroyedStrikers) {
    const striker = updated.get(id);
    if (striker) {
      updated.set(id, { ...striker, target: null });
    }
  }

  return updated;
}

/** Run combat for all entities: attack updates + damage resolution */
export function runCombatSystem(
  entities: Map<EntityId, Entity>,
  gameDelta: number,
): Map<EntityId, Entity> {
  let updated = new Map<EntityId, Entity>();

  for (const [id, entity] of entities) {
    if (entity.state === 'ATTACKING') {
      updated.set(id, updateAttack(entity, entities, gameDelta));
    } else {
      updated.set(id, entity);
    }
  }

  updated = resolveAttacks(updated);
  return updated;
}
