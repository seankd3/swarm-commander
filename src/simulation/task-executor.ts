// --- Task Executor ---
// Entity-centric queue-based execution engine.
// Handles all task types including new weapon tasks (FIRE_CRUISE_MISSILE, FIRE_ARM, REARM, ORBIT).

import type {
  GameState,
  EntityId,
  Entity,
  Position,
  Contact,
  ROE,
  AreaDef,
  Task,
  TaskParams,
  CompletionCondition,
} from './types';
import { getPlatform } from '../platforms/platform-registry';
import { distanceMeters, bearingDegrees, movePosition, normalizeHeading } from './geo';
import { getFormationPositions } from './formations';
import { launchCruiseMissile, launchArm } from './systems/missiles';
import { getPrimaryRunway } from '../data/airbase-runways';
import { initiateLandingOnRunway } from './systems/runway-ops';

// --- Formation Speed Matching ---

/** Get the formation speed for a group of entities.
 * Uses the SLOWEST unit's maxSpeed so the formation stays together. */
function getFormationSpeed(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  speedFraction: number,
): number {
  let minMaxSpeed = Infinity;
  for (const id of assignedIds) {
    const e = entities.get(id);
    if (!e || e.state === 'DESTROYED') continue;
    if (e.maxSpeed < minMaxSpeed) minMaxSpeed = e.maxSpeed;
  }
  if (!isFinite(minMaxSpeed)) return 0;
  return minMaxSpeed * speedFraction;
}

// --- ROE Contact Filtering ---

function getEligibleContacts(
  contacts: Map<string, Contact>,
  roe: ROE,
  area?: AreaDef,
  areaMultiplier?: number,
): Contact[] {
  if (roe === 'WEAPONS_HOLD') return [];

  const eligible: Contact[] = [];
  for (const contact of contacts.values()) {
    if (!contact.isLive) continue;
    if (roe === 'WEAPONS_TIGHT' && area) {
      const radius = area.radius * (areaMultiplier ?? 1);
      if (distanceMeters(contact.position, area.center) <= radius) {
        eligible.push(contact);
      }
    } else if (roe === 'WEAPONS_FREE') {
      // WEAPONS_FREE scoped to area if provided (fixes global contact matching bug)
      if (area) {
        const radius = area.radius * (areaMultiplier ?? 2);
        if (distanceMeters(contact.position, area.center) <= radius) {
          eligible.push(contact);
        }
      } else {
        eligible.push(contact);
      }
    }
  }
  return eligible;
}

function engageContacts(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  eligibleContacts: Contact[],
): Map<EntityId, Entity> {
  if (eligibleContacts.length === 0) return entities;

  const updated = new Map(entities);
  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    const plat = getPlatform(entity.platformId);
    if (!plat.weapon || plat.weapon.type !== 'SUICIDE') continue;
    if (entity.state === 'ATTACKING') continue;
    // Allow engagement from TRANSIT too (fixes MOVE_TO not responsive to contacts)
    if (entity.state !== 'IDLE' && entity.state !== 'TRANSIT') continue;

    let bestContact: Contact | null = null;
    let bestDist = Infinity;
    for (const contact of eligibleContacts) {
      const dist = distanceMeters(entity.position, contact.position);
      if (dist < bestDist) { bestDist = dist; bestContact = contact; }
    }
    if (bestContact) {
      updated.set(id, { ...entity, target: bestContact.entityId, state: 'ATTACKING' });
    }
  }
  return updated;
}

// --- Completion Condition Checking ---

function checkCompletion(
  task: Task,
  condition: CompletionCondition,
  entities: Map<EntityId, Entity>,
  contacts: Map<string, Contact>,
  gameTime: number,
): boolean {
  const alive = task.assignedIds.filter(id => {
    const e = entities.get(id);
    return e && e.state !== 'DESTROYED';
  });

  switch (condition.type) {
    case 'ARRIVAL': {
      if (alive.length === 0) return false;
      // For MOVE_TO: check if all entities are near the destination (not just IDLE)
      if ('destination' in task && task.destination) {
        return alive.every(id => {
          const e = entities.get(id)!;
          return distanceMeters(e.position, (task as { destination: Position }).destination) < MOVE_TO_ARRIVAL_DIST;
        });
      }
      // Fallback: all IDLE
      return alive.every(id => entities.get(id)!.state === 'IDLE');
    }

    case 'FLIGHT_STATE':
      return alive.length > 0 && alive.every(id => entities.get(id)!.flightState === condition.target);

    case 'DURATION':
      return task.activatedAt !== null && (gameTime - task.activatedAt) >= condition.seconds;

    case 'ON_DETECT': {
      const count = condition.count ?? 1;
      let found = 0;
      for (const contact of contacts.values()) {
        if (contact.isLive) found++;
        if (found >= count) return true;
      }
      return false;
    }

    case 'ALL_ENGAGED':
      if (alive.length === 0) return true;
      // For suicide weapons: all must be in ATTACKING state
      // For missile weapons: all must have expended ammo OR be ATTACKING
      return alive.every(id => {
        const e = entities.get(id)!;
        if (e.state === 'ATTACKING') return true;
        // Non-suicide weapon: consider "engaged" if all ammo expended
        if (e.ammoState && e.ammoState.capacity > 0 && e.ammoState.remaining <= 0) return true;
        return false;
      });

    case 'TARGET_DESTROYED': {
      const target = entities.get(condition.entityId);
      return !target || target.state === 'DESTROYED';
    }
  }
}

// --- Task-specific Executors ---

const MOVE_TO_ARRIVAL_DIST = 500; // meters — close enough to destination to count as arrived

function executeMoveToTask(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  destination: Position,
  params: TaskParams,
  contacts: Map<string, Contact>,
): Map<EntityId, Entity> {
  let updated = new Map(entities);

  for (let i = 0; i < assignedIds.length; i++) {
    const entity = updated.get(assignedIds[i]);
    if (!entity || entity.state === 'DESTROYED') continue;

    // Skip entities already near the destination — they've arrived, let completion trigger
    const distToDest = distanceMeters(entity.position, destination);
    if (distToDest < MOVE_TO_ARRIVAL_DIST) continue;

    // Only dispatch IDLE entities (waiting for a new waypoint)
    if (entity.state === 'IDLE') {
      const heading = bearingDegrees(entity.position, destination);
      const positions = getFormationPositions(destination, assignedIds.length, params.formation, heading, params.spacing);
      const speed = assignedIds.length > 1
        ? getFormationSpeed(updated, assignedIds, params.speedFraction)
        : entity.maxSpeed * params.speedFraction;
      updated.set(entity.id, {
        ...entity,
        destination: positions[i],
        state: 'TRANSIT',
        heading,
        velocity: { heading, speed },
      });
    }
  }

  // MOVE_TO with WEAPONS_FREE: engage contacts during transit
  if (params.roe === 'WEAPONS_FREE') {
    const eligible = getEligibleContacts(contacts, params.roe);
    updated = engageContacts(updated, assignedIds, eligible);
  }

  return updated;
}

function executeReconArea(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  area: AreaDef,
  params: TaskParams,
  contacts: Map<string, Contact>,
  gameTime: number,
): Map<EntityId, Entity> {
  let updated = new Map(entities);
  for (let i = 0; i < assignedIds.length; i++) {
    const entity = updated.get(assignedIds[i]);
    if (!entity || entity.state === 'DESTROYED' || entity.state !== 'IDLE') continue;

    // Fix: Use 60-degree increments and alternating radii for stable orbits
    const baseAngle = (360 / assignedIds.length) * i;
    const timeAngle = Math.floor(gameTime / 30) * 60; // 60-degree steps every 30s
    const angle = normalizeHeading(baseAngle + timeAngle);
    const radiusFraction = (Math.floor(gameTime / 30) % 2 === 0) ? 0.6 : 0.8; // alternating radii
    const waypoint = movePosition(area.center, angle, area.radius * radiusFraction);
    const heading = bearingDegrees(entity.position, waypoint);
    const speed = assignedIds.length > 1
      ? getFormationSpeed(updated, assignedIds, params.speedFraction)
      : entity.maxSpeed * params.speedFraction;
    updated.set(entity.id, {
      ...entity,
      destination: waypoint,
      state: 'TRANSIT',
      heading,
      velocity: { heading, speed },
    });
  }

  if (params.roe !== 'WEAPONS_HOLD') {
    const eligible = getEligibleContacts(contacts, params.roe, params.roe === 'WEAPONS_TIGHT' ? area : undefined);
    updated = engageContacts(updated, assignedIds, eligible);
  }
  return updated;
}

function executePatrol(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  area: AreaDef,
  params: TaskParams,
  contacts: Map<string, Contact>,
  _gameTime: number,
): Map<EntityId, Entity> {
  let updated = new Map(entities);
  for (let i = 0; i < assignedIds.length; i++) {
    const entity = updated.get(assignedIds[i]);
    if (!entity || entity.state === 'DESTROYED' || entity.state !== 'IDLE') continue;

    // Fix: Snap to 90-degree boundaries for stable patrol patterns
    const currentBearing = bearingDegrees(area.center, entity.position);
    const snapped = Math.round(currentBearing / 90) * 90;
    const nextAngle = normalizeHeading(snapped + 90 + (i * 90 / Math.max(assignedIds.length, 1)));
    const waypoint = movePosition(area.center, nextAngle, area.radius * 0.8);
    const heading = bearingDegrees(entity.position, waypoint);
    const speed = assignedIds.length > 1
      ? getFormationSpeed(updated, assignedIds, params.speedFraction)
      : entity.maxSpeed * params.speedFraction;
    updated.set(entity.id, {
      ...entity,
      destination: waypoint,
      state: 'TRANSIT',
      heading,
      velocity: { heading, speed },
    });
  }

  if (params.roe !== 'WEAPONS_HOLD') {
    const eligible = getEligibleContacts(contacts, params.roe, params.roe === 'WEAPONS_TIGHT' ? area : undefined);
    updated = engageContacts(updated, assignedIds, eligible);
  }
  return updated;
}

function executeStrikeOnDetect(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  contacts: Map<string, Contact>,
  params: TaskParams,
  watchArea?: AreaDef,
  state?: GameState,
): { entities: Map<EntityId, Entity>; missiles?: typeof state extends undefined ? undefined : any[] } {
  const updated = new Map(entities);
  const eligible = getEligibleContacts(contacts, params.roe, watchArea, 1.5);
  const newMissiles: any[] = [];

  if (eligible.length > 0) {
    // Track how many missiles are already inbound to each contact/entity
    // so we can distribute fire across targets
    const missilesPerTarget = new Map<string, number>();
    if (state) {
      for (const m of state.missiles) {
        const count = missilesPerTarget.get(m.targetId) ?? 0;
        missilesPerTarget.set(m.targetId, count + 1);
      }
      // Also count missiles being launched this tick
      for (const m of newMissiles) {
        const count = missilesPerTarget.get(m.targetId) ?? 0;
        missilesPerTarget.set(m.targetId, count + 1);
      }
    }

    /** Pick the best target, preferring contacts with fewer missiles inbound */
    function pickTarget(entity: Entity, contacts: Contact[]): Contact | null {
      let best: Contact | null = null;
      let bestScore = Infinity; // lower = better
      for (const c of contacts) {
        const dist = distanceMeters(entity.position, c.position);
        const inbound = (missilesPerTarget.get(c.id) ?? 0) + (missilesPerTarget.get(c.entityId) ?? 0);
        // Score: heavily penalize targets with missiles already inbound
        // 2 missiles per target should be enough — prefer untargeted contacts
        const score = dist + inbound * 100000;
        if (score < bestScore) { bestScore = score; best = c; }
      }
      return best;
    }

    for (const id of assignedIds) {
      const entity = updated.get(id);
      if (!entity || entity.state === 'DESTROYED' || entity.state === 'ATTACKING') continue;
      const plat = getPlatform(entity.platformId);
      if (!plat.weapon) continue;

      // Weapon-type-aware engagement
      if (plat.weapon.type === 'SUICIDE') {
        // Suicide: fly directly at closest target
        const bestContact = pickTarget(entity, eligible);
        if (bestContact) {
          updated.set(id, { ...entity, target: bestContact.entityId, state: 'ATTACKING' });
        }

      } else if (plat.weapon.type === 'CRUISE_MISSILE' && state) {
        const bestContact = pickTarget(entity, eligible);
        if (!bestContact) continue;
        // Cruise missile: fire from current position if in range, otherwise move to standoff
        const distToTarget = distanceMeters(entity.position, bestContact.position);
        const standoffRange = plat.weapon.standoffRange ?? 20000;
        if (distToTarget <= plat.weapon.range && distToTarget >= standoffRange * 0.5) {
          // In firing envelope — fire missile
          if (!entity.ammoState || entity.ammoState.remaining <= 0) continue;
          if (state.time.elapsed - entity.lastFireTime < plat.weapon.reloadTime) continue;
          const result = launchCruiseMissile(entity, bestContact.id, bestContact.position, state);
          if (result) {
            updated.set(id, result.entity);
            newMissiles.push(result.missile);
            // Update inbound count so next entity/tick picks a different target
            const count = missilesPerTarget.get(bestContact.id) ?? 0;
            missilesPerTarget.set(bestContact.id, count + 1);
          }
        } else if (entity.state === 'IDLE') {
          // Move to standoff range from target
          const bearing = bearingDegrees(bestContact.position, entity.position);
          const standoffPos = movePosition(bestContact.position, bearing, standoffRange);
          const heading = bearingDegrees(entity.position, standoffPos);
          updated.set(id, {
            ...entity,
            destination: standoffPos,
            state: 'TRANSIT',
            heading,
            velocity: { heading, speed: entity.maxSpeed * params.speedFraction },
          });
        }

      } else if (plat.weapon.type === 'ANTI_RADIATION' && state) {
        // ARM: only fires at emitting radar targets
        // Filter eligible to only radar emitters
        const emitterContacts = eligible.filter(c => {
          const te = state.entities.get(c.entityId);
          if (!te || te.state === 'DESTROYED') return false;
          return te.sensor?.type === 'RADAR' &&
            (te.flightState === 'GROUNDED' || te.radarMode === 'ACTIVE');
        });
        const bestContact = pickTarget(entity, emitterContacts);
        if (!bestContact) continue;

        const targetEntity = state.entities.get(bestContact.entityId)!;
        const distToTarget = distanceMeters(entity.position, targetEntity.position);
        if (distToTarget <= plat.weapon.range) {
          // In range — fire ARM
          if (!entity.ammoState || entity.ammoState.remaining <= 0) continue;
          if (state.time.elapsed - entity.lastFireTime < plat.weapon.reloadTime) continue;
          const result = launchArm(entity, targetEntity.id, targetEntity.position, state);
          if (result) {
            updated.set(id, result.entity);
            newMissiles.push(result.missile);
            const count = missilesPerTarget.get(targetEntity.id) ?? 0;
            missilesPerTarget.set(targetEntity.id, count + 1);
          }
        } else if (entity.state === 'IDLE') {
          // Approach to ARM firing range
          const heading = bearingDegrees(entity.position, targetEntity.position);
          const approachDist = plat.weapon.range * 0.8;
          const approachPos = movePosition(targetEntity.position, bearingDegrees(targetEntity.position, entity.position), approachDist);
          updated.set(id, {
            ...entity,
            destination: approachPos,
            state: 'TRANSIT',
            heading,
            velocity: { heading, speed: entity.maxSpeed * params.speedFraction },
          });
        }
      }
    }
  } else if (watchArea) {
    // No contacts — behavior depends on weapon type
    for (const id of assignedIds) {
      const entity = updated.get(id);
      if (!entity || entity.state === 'DESTROYED') continue;
      if (entity.state !== 'IDLE') continue;

      const plat = getPlatform(entity.platformId);
      const weaponType = plat.weapon?.type;

      if (weaponType === 'CRUISE_MISSILE' || weaponType === 'ANTI_RADIATION') {
        // Standoff/ARM weapons: STAY PUT and wait for contacts.
        // The holding pattern in movement.ts keeps them flying circles.
        // Do NOT advance toward the target.
        continue;
      }

      // SUICIDE or unarmed: advance to watch area center to get in engagement range
      const dist = distanceMeters(entity.position, watchArea.center);
      if (dist > watchArea.radius * 0.5) {
        const heading = bearingDegrees(entity.position, watchArea.center);
        updated.set(id, {
          ...entity,
          destination: watchArea.center,
          state: 'TRANSIT',
          heading,
          velocity: { heading, speed: entity.maxSpeed * params.speedFraction },
        });
      }
    }
  }

  return { entities: updated, missiles: newMissiles };
}

function executeStrikeTarget(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  contactId: string,
  contacts: Map<string, Contact>,
  params: TaskParams,
): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const contact = contacts.get(contactId);
  if (!contact) return updated;

  const targetEntity = entities.get(contact.entityId);
  if (!targetEntity || targetEntity.state === 'DESTROYED') return updated;
  if (params.roe === 'WEAPONS_HOLD') return updated;

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED' || entity.state === 'ATTACKING') continue;
    const platDef = getPlatform(entity.platformId);
    if (platDef.weapon) {
      updated.set(id, { ...entity, target: contact.entityId, state: 'ATTACKING' });
    }
  }
  return updated;
}

function executeTakeoff(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  baseId: EntityId,
): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const base = updated.get(baseId);

  // Check if this base has runway data — if so, queue instead of immediate launch
  const runway = getPrimaryRunway(baseId);

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (entity.flightState !== 'PARKED') continue;

    if (runway && base?.baseState) {
      // Add to launch queue — runway-ops processLaunchQueue will handle actual launch
      if (!base.baseState.launchQueue.includes(id)) {
        const currentBase = updated.get(baseId)!;
        updated.set(baseId, {
          ...currentBase,
          baseState: {
            ...currentBase.baseState!,
            launchQueue: [...currentBase.baseState!.launchQueue, id],
          },
        });
      }
    } else {
      // No runway — immediate launch (original behavior)
      updated.set(id, {
        ...entity,
        flightState: 'LAUNCHING',
        state: 'TRANSIT',
        homeBaseId: baseId,
        position: base ? { ...base.position } : entity.position,
        velocity: { heading: entity.heading, speed: 1 },
      });
    }
  }
  return updated;
}

function executeLand(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  baseId: EntityId,
): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const base = updated.get(baseId);
  if (!base) return updated;

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (entity.flightState === 'AIRBORNE') {
      // Try runway-aligned landing
      const landingData = initiateLandingOnRunway(id, baseId);
      if (landingData) {
        updated.set(id, {
          ...entity,
          flightState: 'RECOVERING',
          state: 'TRANSIT',
          homeBaseId: baseId,
          destination: landingData.destination,
          heading: landingData.heading,
          velocity: { heading: landingData.heading, speed: entity.velocity.speed },
        });
      } else {
        // No runway — original bearing-to-base logic
        const heading = bearingDegrees(entity.position, base.position);
        updated.set(id, {
          ...entity,
          flightState: 'RECOVERING',
          state: 'TRANSIT',
          homeBaseId: baseId,
          destination: base.position,
          heading,
          velocity: { heading, speed: entity.velocity.speed },
        });
      }
    }
  }
  return updated;
}

function executeRtb(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  baseId: EntityId | null,
  tasks: Task[],
  state: GameState,
): { entities: Map<EntityId, Entity>; tasks: Task[] } {
  const updated = new Map(entities);

  let base: Entity | undefined;
  if (baseId) {
    base = updated.get(baseId);
  } else {
    const first = assignedIds.length > 0 ? updated.get(assignedIds[0]) : undefined;
    if (first) {
      let bestDist = Infinity;
      for (const [, e] of updated) {
        if (e.faction !== first.faction || e.state === 'DESTROYED') continue;
        const plat = getPlatform(e.platformId);
        if (!plat.base) continue;
        const dist = distanceMeters(first.position, e.position);
        if (dist < bestDist) { bestDist = dist; base = e; }
      }
    }
  }
  if (!base) return { entities: updated, tasks };

  const RTB_ARRIVAL = 500;
  const newTasks = [...tasks];

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (entity.flightState !== 'AIRBORNE') continue;

    const dist = distanceMeters(entity.position, base.position);
    if (dist < RTB_ARRIVAL) {
      // Fix: Auto-inject LAND task when RTB arrives at base
      const hasLand = entity.taskQueue.some(tid => {
        const t = newTasks.find(task => task.id === tid);
        return t && t.type === 'LAND';
      });
      if (!hasLand) {
        const landTaskId = `auto-land-${id}-${state.time.elapsed}`;
        newTasks.push({
          type: 'LAND',
          id: landTaskId,
          assignedIds: [id],
          status: 'QUEUED',
          completionCondition: { type: 'FLIGHT_STATE', target: 'PARKED' },
          createdAt: state.time.elapsed,
          activatedAt: null,
          params: { roe: 'WEAPONS_HOLD', formation: 'NONE', spacing: 0, speedFraction: 0.5, radarMode: 'PASSIVE' },
          baseId: base.id,
        });
        updated.set(id, {
          ...entity,
          homeBaseId: base.id,
          taskQueue: [...entity.taskQueue, landTaskId],
        });
      } else {
        updated.set(id, { ...entity, homeBaseId: base.id });
      }
      continue;
    }
    if (entity.state === 'IDLE') {
      const heading = bearingDegrees(entity.position, base.position);
      updated.set(id, {
        ...entity,
        destination: base.position,
        state: 'TRANSIT',
        heading,
        homeBaseId: base.id,
        velocity: { heading, speed: entity.maxSpeed * 0.8 },
      });
    }
  }
  return { entities: updated, tasks: newTasks };
}

// --- New Task Executors ---

function executeFireCruiseMissile(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  task: { targetContactId: string; targetPosition: Position; standoffPosition: Position },
  state: GameState,
): { entities: Map<EntityId, Entity>; missiles: typeof state.missiles } {
  const updated = new Map(entities);
  const missiles = [...state.missiles];

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (!entity.ammoState || entity.ammoState.remaining <= 0) continue;

    // Move to standoff position first
    const distToStandoff = distanceMeters(entity.position, task.standoffPosition);
    if (distToStandoff > 2000 && entity.state === 'IDLE') {
      const heading = bearingDegrees(entity.position, task.standoffPosition);
      updated.set(id, {
        ...entity,
        destination: task.standoffPosition,
        state: 'TRANSIT',
        heading,
        velocity: { heading, speed: entity.maxSpeed * 0.6 },
      });
      continue;
    }

    // At standoff position — fire if reload ready
    const plat = getPlatform(entity.platformId);
    if (!plat.weapon) continue;
    if (state.time.elapsed - entity.lastFireTime < plat.weapon.reloadTime) continue;

    // Get current target position from contacts if available
    const contact = state.contacts.get(task.targetContactId);
    const targetPos = contact ? contact.position : task.targetPosition;

    const result = launchCruiseMissile(entity, task.targetContactId, targetPos, state);
    if (result) {
      updated.set(id, result.entity);
      missiles.push(result.missile);
    }
  }

  return { entities: updated, missiles };
}

function executeFireArm(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  task: { targetEntityId: EntityId; targetPosition: Position; approachPosition: Position },
  state: GameState,
): { entities: Map<EntityId, Entity>; missiles: typeof state.missiles } {
  const updated = new Map(entities);
  const missiles = [...state.missiles];

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (!entity.ammoState || entity.ammoState.remaining <= 0) continue;

    // Move to approach position first
    const distToApproach = distanceMeters(entity.position, task.approachPosition);
    if (distToApproach > 2000 && entity.state === 'IDLE') {
      const heading = bearingDegrees(entity.position, task.approachPosition);
      updated.set(id, {
        ...entity,
        destination: task.approachPosition,
        state: 'TRANSIT',
        heading,
        velocity: { heading, speed: entity.maxSpeed * 0.8 },
      });
      continue;
    }

    // At approach position — check if target is emitting, then fire
    const target = state.entities.get(task.targetEntityId);
    if (!target || target.state === 'DESTROYED') continue;

    const plat = getPlatform(entity.platformId);
    if (!plat.weapon) continue;
    if (state.time.elapsed - entity.lastFireTime < plat.weapon.reloadTime) continue;

    // Check if target has active radar (is emitting)
    const isEmitting = target.sensor?.type === 'RADAR' &&
      (target.flightState === 'GROUNDED' || target.radarMode === 'ACTIVE');
    if (!isEmitting) continue;

    const result = launchArm(entity, task.targetEntityId, target.position, state);
    if (result) {
      updated.set(id, result.entity);
      missiles.push(result.missile);
    }
  }

  return { entities: updated, missiles };
}

function executeRearm(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  baseId: EntityId,
  gameTime: number,
): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const base = updated.get(baseId);
  if (!base) return updated;

  for (const id of assignedIds) {
    const entity = updated.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;
    if (entity.flightState !== 'PARKED') continue;
    if (!entity.ammoState) continue;

    // Rearm over time: add 1 round every 5 seconds
    if (entity.ammoState.remaining < entity.ammoState.capacity) {
      const rearmInterval = 5;
      const timeSinceLast = gameTime - entity.lastFireTime;
      if (timeSinceLast >= rearmInterval) {
        updated.set(id, {
          ...entity,
          ammoState: {
            ...entity.ammoState,
            remaining: Math.min(entity.ammoState.remaining + 1, entity.ammoState.capacity),
          },
          lastFireTime: gameTime,
        });
      }
    }
  }
  return updated;
}

function executeOrbit(
  entities: Map<EntityId, Entity>,
  assignedIds: EntityId[],
  center: Position,
  radius: number,
  params: TaskParams,
  gameTime: number,
): Map<EntityId, Entity> {
  const updated = new Map(entities);

  for (let i = 0; i < assignedIds.length; i++) {
    const entity = updated.get(assignedIds[i]);
    if (!entity || entity.state === 'DESTROYED') continue;

    // Set orbit state
    if (entity.state === 'IDLE') {
      // Calculate next orbit waypoint
      const baseAngle = (360 / assignedIds.length) * i;
      const timeAngle = normalizeHeading(gameTime * 3); // slow orbit
      const angle = normalizeHeading(baseAngle + timeAngle);
      const waypoint = movePosition(center, angle, radius);
      const heading = bearingDegrees(entity.position, waypoint);

      updated.set(entity.id, {
        ...entity,
        destination: waypoint,
        state: 'TRANSIT',
        orbitRadius: radius,
        heading,
        velocity: { heading, speed: entity.maxSpeed * params.speedFraction },
      });
    }
  }

  return updated;
}

// --- ISR Evasion ---

const EVASION_COOLDOWN = 10; // seconds
const evasionTimestamps = new Map<EntityId, number>();

function checkEvasion(
  entities: Map<EntityId, Entity>,
  gameTime: number,
): Map<EntityId, Entity> {
  const updated = new Map(entities);

  for (const [id, entity] of updated) {
    if (entity.faction !== 'BLUE') continue;
    if (entity.state === 'DESTROYED' || entity.state === 'ATTACKING') continue;
    if (!entity.isDetected) continue;

    // Only ISR drones evade (no weapon)
    const plat = getPlatform(entity.platformId);
    if (plat.weapon) continue;
    if (!plat.movement) continue;

    // Cooldown check
    const lastEvasion = evasionTimestamps.get(id) ?? 0;
    if (gameTime - lastEvasion < EVASION_COOLDOWN) continue;

    // Find nearest threat
    let nearestThreatPos: Position | null = null;
    let nearestDist = Infinity;
    for (const [, other] of updated) {
      if (other.faction === entity.faction) continue;
      if (other.state === 'DESTROYED') continue;
      const otherPlat = getPlatform(other.platformId);
      if (!otherPlat.sensor) continue;
      const dist = distanceMeters(entity.position, other.position);
      if (dist < otherPlat.sensor.range && dist < nearestDist) {
        nearestDist = dist;
        nearestThreatPos = other.position;
      }
    }

    if (nearestThreatPos) {
      // Flee away from threat
      const fleeHeading = normalizeHeading(bearingDegrees(nearestThreatPos, entity.position));
      const fleePoint = movePosition(entity.position, fleeHeading, 5000);
      updated.set(id, {
        ...entity,
        destination: fleePoint,
        state: 'TRANSIT',
        heading: fleeHeading,
        velocity: { heading: fleeHeading, speed: entity.maxSpeed },
      });
      evasionTimestamps.set(id, gameTime);
    }
  }

  return updated;
}

// --- Post-mission auto-RTB ---

const autoRtbInjected = new Set<EntityId>();

function checkAutoRtb(
  entities: Map<EntityId, Entity>,
  tasks: Task[],
  state: GameState,
): { entities: Map<EntityId, Entity>; tasks: Task[] } {
  const updated = new Map(entities);
  const newTasks = [...tasks];

  for (const [id, entity] of updated) {
    if (entity.faction !== 'BLUE') continue;
    if (entity.state === 'DESTROYED') continue;
    if (entity.flightState !== 'AIRBORNE') continue;
    if (entity.currentTaskId || entity.taskQueue.length > 0) continue;
    if (autoRtbInjected.has(id)) continue;

    // No tasks — idle in the air. Auto-inject RTB + LAND.
    autoRtbInjected.add(id);

    // Find home base
    let base: Entity | undefined;
    if (entity.homeBaseId) {
      base = updated.get(entity.homeBaseId);
    }
    if (!base) {
      let bestDist = Infinity;
      for (const [, e] of updated) {
        if (e.faction !== entity.faction || e.state === 'DESTROYED') continue;
        const plat = getPlatform(e.platformId);
        if (!plat.base) continue;
        const dist = distanceMeters(entity.position, e.position);
        if (dist < bestDist) { bestDist = dist; base = e; }
      }
    }
    if (!base) continue;

    const rtbId = `auto-rtb-${id}-${state.time.elapsed}`;
    const landId = `auto-land-${id}-${state.time.elapsed}`;
    const holdParams: TaskParams = { roe: 'WEAPONS_HOLD', formation: 'NONE', spacing: 0, speedFraction: 0.8, radarMode: 'ACTIVE' };

    newTasks.push(
      {
        type: 'RTB', id: rtbId, assignedIds: [id], status: 'QUEUED',
        completionCondition: { type: 'ARRIVAL' },
        createdAt: state.time.elapsed, activatedAt: null,
        params: holdParams, baseId: base.id,
      },
      {
        type: 'LAND', id: landId, assignedIds: [id], status: 'QUEUED',
        completionCondition: { type: 'FLIGHT_STATE', target: 'PARKED' },
        createdAt: state.time.elapsed, activatedAt: null,
        params: { ...holdParams, speedFraction: 0.5 }, baseId: base.id,
      },
    );

    updated.set(id, {
      ...entity,
      currentTaskId: rtbId,
      taskQueue: [landId],
    });

    // Activate RTB
    const rtbIdx = newTasks.length - 2;
    newTasks[rtbIdx] = { ...newTasks[rtbIdx], status: 'ACTIVE', activatedAt: state.time.elapsed };
  }

  return { entities: updated, tasks: newTasks };
}

// --- Main Entry Point ---

export function runTaskSystem(state: GameState, _gameDelta: number): GameState {
  let entities = new Map(state.entities);
  let tasks = [...state.tasks];
  let missiles = [...state.missiles];
  const taskMap = new Map<string, number>();
  tasks.forEach((t, i) => taskMap.set(t.id, i));

  // ISR evasion check (before task processing)
  entities = checkEvasion(entities, state.time.elapsed);

  // Process each entity's task queue
  for (const [entityId, entity] of entities) {
    if (entity.state === 'DESTROYED') continue;
    if (entity.flightState === 'PARKED' && !entity.currentTaskId && entity.taskQueue.length === 0) continue;

    // 1. Check if current task is complete/failed — clear it
    if (entity.currentTaskId) {
      const taskIdx = taskMap.get(entity.currentTaskId);
      if (taskIdx !== undefined) {
        const task = tasks[taskIdx];
        if (task.status === 'COMPLETE' || task.status === 'FAILED') {
          entities.set(entityId, { ...entities.get(entityId)!, currentTaskId: null });
        }
      } else {
        entities.set(entityId, { ...entities.get(entityId)!, currentTaskId: null });
      }
    }

    // 2. If no current task, pop from queue
    const current = entities.get(entityId)!;
    if (!current.currentTaskId && current.taskQueue.length > 0) {
      const nextTaskId = current.taskQueue[0];
      const rest = current.taskQueue.slice(1);
      entities.set(entityId, { ...current, currentTaskId: nextTaskId, taskQueue: rest });

      const taskIdx = taskMap.get(nextTaskId);
      if (taskIdx !== undefined && tasks[taskIdx].status === 'QUEUED') {
        tasks[taskIdx] = { ...tasks[taskIdx], status: 'ACTIVE', activatedAt: state.time.elapsed };
      }
    }
  }

  // Execute active tasks
  const processedTaskIds = new Set<string>();
  for (const [, entity] of entities) {
    if (!entity.currentTaskId) continue;
    if (processedTaskIds.has(entity.currentTaskId)) continue;
    processedTaskIds.add(entity.currentTaskId);

    const taskIdx = taskMap.get(entity.currentTaskId);
    if (taskIdx === undefined) continue;
    const task = tasks[taskIdx];
    if (task.status !== 'ACTIVE') continue;

    // Sync radar mode
    for (const id of task.assignedIds) {
      const e = entities.get(id);
      if (e && e.state !== 'DESTROYED' && e.radarMode !== task.params.radarMode) {
        entities.set(id, { ...e, radarMode: task.params.radarMode });
      }
    }

    // Execute by type
    switch (task.type) {
      case 'MOVE_TO':
        entities = executeMoveToTask(entities, task.assignedIds, task.destination, task.params, state.contacts);
        break;
      case 'RECON_AREA':
        entities = executeReconArea(entities, task.assignedIds, task.area, task.params, state.contacts, state.time.elapsed);
        break;
      case 'PATROL':
        entities = executePatrol(entities, task.assignedIds, task.area, task.params, state.contacts, state.time.elapsed);
        break;
      case 'STRIKE_ON_DETECT': {
        const sodResult = executeStrikeOnDetect(entities, task.assignedIds, state.contacts, task.params, task.watchArea, { ...state, entities, missiles });
        entities = sodResult.entities;
        if (sodResult.missiles) missiles.push(...sodResult.missiles);
        break;
      }
      case 'STRIKE_TARGET':
        entities = executeStrikeTarget(entities, task.assignedIds, task.contactId, state.contacts, task.params);
        break;
      case 'TAKEOFF':
        entities = executeTakeoff(entities, task.assignedIds, task.baseId);
        break;
      case 'LAND':
        entities = executeLand(entities, task.assignedIds, task.baseId);
        break;
      case 'RTB': {
        const rtbResult = executeRtb(entities, task.assignedIds, task.baseId, tasks, state);
        entities = rtbResult.entities;
        tasks = rtbResult.tasks;
        // Rebuild task map since new tasks may have been added
        taskMap.clear();
        tasks.forEach((t, i) => taskMap.set(t.id, i));
        break;
      }
      case 'FIRE_CRUISE_MISSILE': {
        const cmResult = executeFireCruiseMissile(
          entities, task.assignedIds,
          { targetContactId: task.targetContactId, targetPosition: task.targetPosition, standoffPosition: task.standoffPosition },
          { ...state, entities, missiles },
        );
        entities = cmResult.entities;
        missiles = cmResult.missiles;
        break;
      }
      case 'FIRE_ARM': {
        const armResult = executeFireArm(
          entities, task.assignedIds,
          { targetEntityId: task.targetEntityId, targetPosition: task.targetPosition, approachPosition: task.approachPosition },
          { ...state, entities, missiles },
        );
        entities = armResult.entities;
        missiles = armResult.missiles;
        break;
      }
      case 'REARM':
        entities = executeRearm(entities, task.assignedIds, task.baseId, state.time.elapsed);
        break;
      case 'ORBIT':
        entities = executeOrbit(entities, task.assignedIds, task.center, task.radius, task.params, state.time.elapsed);
        break;
    }

    // Check completion condition
    if (checkCompletion(task, task.completionCondition, entities, state.contacts, state.time.elapsed)) {
      tasks[taskIdx] = { ...task, status: 'COMPLETE' };
    }

    // Check if all assigned entities are destroyed
    const allDead = task.assignedIds.every(id => {
      const e = entities.get(id);
      return !e || e.state === 'DESTROYED';
    });
    if (allDead && tasks[taskIdx].status !== 'COMPLETE') {
      if (task.type === 'STRIKE_TARGET' || task.type === 'STRIKE_ON_DETECT') {
        if (task.completionCondition.type === 'TARGET_DESTROYED') {
          const target = entities.get(task.completionCondition.entityId);
          if (!target || target.state === 'DESTROYED') {
            tasks[taskIdx] = { ...task, status: 'COMPLETE' };
            continue;
          }
        }
        if (task.completionCondition.type === 'ALL_ENGAGED') {
          tasks[taskIdx] = { ...task, status: 'COMPLETE' };
          continue;
        }
      }
      tasks[taskIdx] = { ...tasks[taskIdx], status: 'FAILED' };
    }
  }

  // Post-mission auto-RTB check (injects RTB+LAND for idle airborne units)
  const rtbResult = checkAutoRtb(entities, tasks, state);
  entities = rtbResult.entities;
  tasks = rtbResult.tasks;

  return { ...state, entities, tasks, missiles };
}
