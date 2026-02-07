// --- Missile System ---
// All projectile flight + hit resolution: SAMs, cruise missiles, ARMs.
// Handles guidance types: FIRE_FORGET, LATTICE_NETWORKED, EMISSION_HOMING.

import type { Entity, EntityId, Missile, GameState, Position, Contact } from '../types';
import { getPlatform } from '../../platforms/platform-registry';
import { distanceMeters, bearingDegrees, movePosition } from '../geo';

const MISSILE_HIT_RADIUS = 100; // meters

// ===== RED SAM LAUNCH (existing behavior) =====

/** Missile launchers (RED SAMs) fire at detected targets within range */
export function runMissileLaunchSystem(
  state: GameState,
): { entities: Map<EntityId, Entity>; missiles: Missile[] } {
  const entities = new Map(state.entities);
  const missiles = [...state.missiles];
  const gameTime = state.time.elapsed;

  for (const [id, entity] of entities) {
    if (entity.state === 'DESTROYED') continue;
    const platform = getPlatform(entity.platformId);
    if (!platform.weapon || platform.weapon.type !== 'MISSILE') continue;

    const weapon = platform.weapon;

    let bestTarget: Entity | null = null;
    let bestDist = Infinity;

    for (const candidate of entities.values()) {
      if (candidate.faction === entity.faction || candidate.state === 'DESTROYED') continue;
      if (!candidate.isDetected) continue;
      // SAMs only target airborne entities
      if (candidate.flightState !== 'AIRBORNE' && candidate.flightState !== 'LAUNCHING') continue;

      const dist = distanceMeters(entity.position, candidate.position);
      if (dist <= weapon.range && dist < bestDist) {
        bestDist = dist;
        bestTarget = candidate;
      }
    }

    if (!bestTarget) continue;
    if (gameTime - entity.lastFireTime < weapon.reloadTime) continue;

    const alreadyTracking = missiles.some(m => m.targetId === bestTarget!.id && m.launchedBy === id);
    if (alreadyTracking) continue;

    const heading = bearingDegrees(entity.position, bestTarget.position);
    missiles.push({
      id: `missile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      position: { ...entity.position },
      targetId: bestTarget.id,
      speed: weapon.missileSpeed!,
      heading,
      launchedBy: id,
      faction: entity.faction,
      guidanceType: 'FIRE_FORGET',
      damage: weapon.damage,
      lastKnownTargetPos: { ...bestTarget.position },
    });

    entities.set(id, { ...entity, lastFireTime: gameTime });
  }

  return { entities, missiles };
}

// ===== BLUE WEAPON LAUNCH =====

/** Launch a cruise missile from a BLUE entity at a contact position */
export function launchCruiseMissile(
  entity: Entity,
  targetContactId: string,
  targetPos: Position,
  state: GameState,
): { entity: Entity; missile: Missile } | null {
  const platform = getPlatform(entity.platformId);
  if (!platform.weapon || platform.weapon.type !== 'CRUISE_MISSILE') return null;
  if (!entity.ammoState || entity.ammoState.remaining <= 0) return null;

  const dist = distanceMeters(entity.position, targetPos);
  if (dist > platform.weapon.range) return null;
  if (dist < (platform.weapon.standoffRange ?? 0) * 0.5) return null; // too close

  const heading = bearingDegrees(entity.position, targetPos);
  const missile: Missile = {
    id: `cm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    position: { ...entity.position },
    targetId: targetContactId, // contact ID, resolved each tick via COP
    speed: platform.weapon.missileSpeed!,
    heading,
    launchedBy: entity.id,
    faction: entity.faction,
    guidanceType: 'LATTICE_NETWORKED',
    damage: platform.weapon.damage,
    lastKnownTargetPos: { ...targetPos },
  };

  const updatedEntity: Entity = {
    ...entity,
    ammoState: { ...entity.ammoState, remaining: entity.ammoState.remaining - 1 },
    lastFireTime: state.time.elapsed,
  };

  return { entity: updatedEntity, missile };
}

/** Launch an anti-radiation missile from a BLUE entity at an emitter */
export function launchArm(
  entity: Entity,
  targetEntityId: EntityId,
  targetPos: Position,
  state: GameState,
): { entity: Entity; missile: Missile } | null {
  const platform = getPlatform(entity.platformId);
  if (!platform.weapon || platform.weapon.type !== 'ANTI_RADIATION') return null;
  if (!entity.ammoState || entity.ammoState.remaining <= 0) return null;

  const dist = distanceMeters(entity.position, targetPos);
  if (dist > platform.weapon.range) return null;

  const heading = bearingDegrees(entity.position, targetPos);
  const missile: Missile = {
    id: `arm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    position: { ...entity.position },
    targetId: targetEntityId,
    speed: platform.weapon.missileSpeed!,
    heading,
    launchedBy: entity.id,
    faction: entity.faction,
    guidanceType: 'EMISSION_HOMING',
    damage: platform.weapon.damage,
    lastKnownTargetPos: { ...targetPos },
  };

  const updatedEntity: Entity = {
    ...entity,
    ammoState: { ...entity.ammoState, remaining: entity.ammoState.remaining - 1 },
    lastFireTime: state.time.elapsed,
  };

  return { entity: updatedEntity, missile };
}

// ===== MISSILE FLIGHT + GUIDANCE =====

/** Update missile positions and resolve hits, handling all guidance types */
export function runMissileFlightSystem(
  missiles: Missile[],
  entities: Map<EntityId, Entity>,
  contacts: Map<string, Contact>,
  gameDelta: number,
): { missiles: Missile[]; entities: Map<EntityId, Entity> } {
  const updatedEntities = new Map(entities);
  const survivingMissiles: Missile[] = [];

  for (const missile of missiles) {
    // Determine target position based on guidance type
    const targetPos = resolveGuidanceTarget(missile, updatedEntities, contacts);

    if (!targetPos) {
      // No target information at all — missile lost, remove it
      continue;
    }

    const dist = distanceMeters(missile.position, targetPos);
    const heading = bearingDegrees(missile.position, targetPos);

    // Hit check
    if (dist < MISSILE_HIT_RADIUS) {
      // Try to find the actual entity at this location
      const hitEntity = findHitEntity(missile, targetPos, updatedEntities);
      if (hitEntity) {
        const newHealth = Math.max(0, hitEntity.health - missile.damage);
        updatedEntities.set(hitEntity.id, {
          ...hitEntity,
          health: newHealth,
          state: newHealth <= 0 ? 'DESTROYED' : hitEntity.state,
        });
      }
      // Missile consumed on hit
      continue;
    }

    // Move missile toward target
    const moveDistance = missile.speed * gameDelta;
    const newPos = movePosition(missile.position, heading, Math.min(moveDistance, dist));

    survivingMissiles.push({
      ...missile,
      position: newPos,
      heading,
      lastKnownTargetPos: targetPos,
    });
  }

  return { missiles: survivingMissiles, entities: updatedEntities };
}

/** Resolve where a missile should fly based on its guidance type */
function resolveGuidanceTarget(
  missile: Missile,
  entities: Map<EntityId, Entity>,
  contacts: Map<string, Contact>,
): Position | null {
  switch (missile.guidanceType) {
    case 'FIRE_FORGET': {
      // Track target entity directly (SAMs)
      const target = entities.get(missile.targetId);
      if (target && target.state !== 'DESTROYED') {
        return target.position;
      }
      // Target dead — fly to last known
      return missile.lastKnownTargetPos;
    }

    case 'LATTICE_NETWORKED': {
      // Cruise missile — check shared COP for live contact data
      // targetId is a contact ID for cruise missiles
      const contact = contacts.get(missile.targetId);
      if (contact && contact.isLive) {
        // Live tracking via any friendly sensor
        return contact.position;
      }
      if (contact) {
        // Contact exists but stale — fly to last known contact position
        return contact.position;
      }
      // Also check if targetId is an entity ID (fallback)
      const entity = entities.get(missile.targetId);
      if (entity && entity.state !== 'DESTROYED') {
        return entity.position;
      }
      // No data — fly to last known position
      return missile.lastKnownTargetPos;
    }

    case 'EMISSION_HOMING': {
      // ARM — track active radar emitters
      const target = entities.get(missile.targetId);
      if (target && target.state !== 'DESTROYED') {
        // Check if target is still emitting (has active radar)
        if (target.radarMode === 'ACTIVE' || hasActiveRadar(target)) {
          return target.position;
        }
        // Radar shut down — fly to last known position
        return missile.lastKnownTargetPos;
      }
      return missile.lastKnownTargetPos;
    }
  }
}

/** Check if a ground entity has an active radar (sensor present = emitting) */
function hasActiveRadar(entity: Entity): boolean {
  if (!entity.sensor) return false;
  if (entity.sensor.type !== 'RADAR') return false;
  // Ground radars are always emitting (they don't have radarMode toggle)
  if (entity.flightState === 'GROUNDED') return true;
  return entity.radarMode === 'ACTIVE';
}

/** Find entity near hit position for damage resolution */
function findHitEntity(
  missile: Missile,
  targetPos: Position,
  entities: Map<EntityId, Entity>,
): Entity | null {
  // First try direct target entity
  const directTarget = entities.get(missile.targetId);
  if (directTarget && directTarget.state !== 'DESTROYED') {
    const dist = distanceMeters(directTarget.position, targetPos);
    if (dist < MISSILE_HIT_RADIUS * 3) {
      return directTarget;
    }
  }

  // For Lattice-networked missiles, find nearest enemy entity near impact
  if (missile.guidanceType === 'LATTICE_NETWORKED') {
    let nearest: Entity | null = null;
    let nearestDist = MISSILE_HIT_RADIUS * 2;
    for (const entity of entities.values()) {
      if (entity.faction === missile.faction) continue;
      if (entity.state === 'DESTROYED') continue;
      const dist = distanceMeters(entity.position, missile.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = entity;
      }
    }
    return nearest;
  }

  return directTarget?.state !== 'DESTROYED' ? directTarget ?? null : null;
}
