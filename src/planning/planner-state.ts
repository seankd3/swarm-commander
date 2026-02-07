// --- Planner State Machine ---
// Simplified logic for the 3-step mission planner.
// No DOM dependencies — main.ts handles rendering.

import type {
  GameState,
  EntityId,
  Entity,
  Position,
  Task,
} from '../simulation/types';
import type {
  PlannerState,
  MissionConfig,
  ApproachVariantDef,
  MissionTypeDef,
} from './mission-planner-types';
import { createInitialPlannerState, createDefaultOverrides } from './mission-planner-types';
import { MISSION_TYPES } from './mission-types';
import { getApproachVariant } from './approach-variants';
import { getCapabilities, satisfiesRequirements } from './capabilities';
import type { Capability } from './capabilities';
import { getPlatform } from '../platforms/platform-registry';
import { generateMissionTasks } from './task-generators';

// ===== MISSION TYPE AVAILABILITY =====

export interface AvailableMissionType {
  def: MissionTypeDef;
  available: boolean;
  missingHint: string | null;
}

/** Check which mission types are available for the given entity IDs */
export function getAvailableMissionTypesForEntities(
  entityIds: EntityId[],
  state: GameState,
): AvailableMissionType[] {
  const platformIds = entityIds
    .map(id => state.entities.get(id))
    .filter((e): e is Entity => !!e && e.state !== 'DESTROYED')
    .map(e => e.platformId);

  return MISSION_TYPES.map(def => {
    const available = satisfiesRequirements(platformIds, def.requirements);
    let missingHint: string | null = null;

    if (!available) {
      for (const req of def.requirements) {
        const min = req.min ?? 1;
        let matchCount = 0;
        for (const pid of platformIds) {
          const caps = getCapabilities(getPlatform(pid));
          if (req.any.every(c => caps.has(c))) matchCount++;
        }
        if (matchCount < min) {
          const capNames = req.any.map(formatCapability).join(' + ');
          missingHint = min > 1
            ? `Needs ${min}x ${capNames}`
            : `Needs: ${capNames}`;
          break;
        }
      }
    }

    return { def, available, missingHint };
  });
}

function formatCapability(cap: Capability): string {
  const labels: Record<Capability, string> = {
    'LONG_RANGE_SENSOR': 'Long-Range Sensor',
    'SHORT_RANGE_SENSOR': 'Short-Range Sensor',
    'HAS_SENSOR': 'Sensor',
    'HAS_WEAPON': 'Weapon',
    'SUICIDE_STRIKE': 'Suicide Strike',
    'STANDOFF_WEAPON': 'Standoff Weapon',
    'HAS_ARM': 'Anti-Radiation Missile',
    'HAS_CRUISE_MISSILE': 'Cruise Missile',
    'LOW_OBSERVABLE': 'Stealth',
    'EMISSION_HOMING': 'Emission Homing',
    'HIGH_SPEED': 'High Speed',
    'LOW_SPEED': 'Low Speed',
    'HAS_MOVEMENT': 'Movement',
    'LONG_ENDURANCE': 'Long Endurance',
    'SHORT_ENDURANCE': 'Short Endurance',
    'IS_BASE': 'Base',
    'CAN_FLY': 'Aircraft',
    'IS_GROUND': 'Ground Unit',
  };
  return labels[cap] || cap;
}

// ===== APPROACH AUTO-SELECTION =====

/** Auto-pick approach variant based on mission type and unit capabilities */
export function pickApproach(
  missionTypeId: string,
  entityIds: EntityId[],
  state: GameState,
): ApproachVariantDef | null {
  const missionType = MISSION_TYPES.find(m => m.id === missionTypeId);
  if (!missionType) return null;

  const platformIds = entityIds
    .map(id => state.entities.get(id))
    .filter((e): e is Entity => !!e && e.state !== 'DESTROYED')
    .map(e => e.platformId);

  // Check if any unit has a cruise missile with range > 100km
  const hasCruiseMissile = platformIds.some(pid => {
    const plat = getPlatform(pid);
    return plat.weapon?.type === 'CRUISE_MISSILE' && plat.weapon.range > 100000;
  });

  switch (missionTypeId) {
    case 'RECON':
      return getApproachVariant('recon-standoff-orbit') ?? null;
    case 'STRIKE':
      return getApproachVariant(hasCruiseMissile ? 'strike-jassm-standoff' : 'strike-jdam-penetrate') ?? null;
    case 'SEAD':
      return getApproachVariant(hasCruiseMissile ? 'sead-standoff' : 'sead-penetrate') ?? null;
    default:
      return null;
  }
}

// ===== ROLE ASSIGNMENT =====

/** Auto-assign entities to roles based on capabilities */
export function autoAssignRoles(
  approach: ApproachVariantDef,
  committedEntityIds: EntityId[],
  state: GameState,
): Map<string, EntityId[]> {
  const assignments = new Map<string, EntityId[]>();
  const assigned = new Set<EntityId>();

  // Sort roles by specificity (more required capabilities first)
  const sortedRoles = [...approach.roles].sort(
    (a, b) => b.requiredCapabilities.length - a.requiredCapabilities.length,
  );

  for (const role of sortedRoles) {
    const roleIds: EntityId[] = [];

    for (const eid of committedEntityIds) {
      if (assigned.has(eid)) continue;
      const entity = state.entities.get(eid);
      if (!entity) continue;

      const caps = getCapabilities(getPlatform(entity.platformId));
      const matches = role.requiredCapabilities.every(rc => caps.has(rc));
      if (matches) {
        roleIds.push(eid);
        assigned.add(eid);
        if (role.maxCount > 0 && roleIds.length >= role.maxCount) break;
      }
    }

    assignments.set(role.id, roleIds);
  }

  // Assign any unassigned entities to the first role that accepts more
  for (const eid of committedEntityIds) {
    if (assigned.has(eid)) continue;
    for (const role of sortedRoles) {
      const current = assignments.get(role.id) ?? [];
      if (role.maxCount < 0 || current.length < role.maxCount) {
        current.push(eid);
        assignments.set(role.id, current);
        assigned.add(eid);
        break;
      }
    }
  }

  return assignments;
}

// ===== STATE TRANSITIONS =====

/** Reset planner to step 1 */
export function resetPlanner(): PlannerState {
  return createInitialPlannerState();
}

// ===== QUICK LAUNCH =====

/** One-call launch: filters entities, picks approach, assigns roles, generates tasks */
export function quickLaunch(
  selectedEntityIds: EntityId[],
  missionTypeId: string,
  targetPosition: Position,
  ingressPoint: Position | null,
  egressPoint: Position | null,
  state: GameState,
): { tasks: Task[]; entityUpdates: Map<EntityId, Partial<Entity>> } | null {
  // 1. Filter to available entities (alive, BLUE, mobile, idle)
  const validIds = selectedEntityIds.filter(id => {
    const e = state.entities.get(id);
    if (!e) return false;
    if (e.faction !== 'BLUE') return false;
    if (e.state === 'DESTROYED') return false;
    const plat = getPlatform(e.platformId);
    if (!plat.movement) return false;
    return true;
  });
  if (validIds.length === 0) return null;

  // 2. Pick approach
  const approach = pickApproach(missionTypeId, validIds, state);
  if (!approach) return null;

  // 3. Auto-assign roles
  const roleAssignments = autoAssignRoles(approach, validIds, state);

  // 4. Build overrides with defaults + ingress/egress
  const overrides = createDefaultOverrides();
  overrides.ingressPoint = ingressPoint;
  overrides.egressPoint = egressPoint;
  overrides.autoRtb = true;

  // Set role-specific defaults from approach
  for (const role of approach.roles) {
    if (approach.defaultParams.radarMode) {
      overrides.roleRadarModes.set(role.id, approach.defaultParams.radarMode);
    }
    if (approach.defaultParams.roe) {
      overrides.roleROEs.set(role.id, approach.defaultParams.roe);
    }
    if (approach.defaultParams.speedFraction) {
      overrides.roleSpeedFractions.set(role.id, approach.defaultParams.speedFraction);
    }
  }

  // 5. Build MissionConfig
  const config: MissionConfig = {
    committedEntityIds: validIds,
    missionTypeId,
    approachId: approach.id,
    roleAssignments,
    targetPosition,
    targetRadius: 20000,  // Fixed 20km radius
    overrides,
  };

  // 6. Generate tasks
  const tasks = generateMissionTasks(config, state);
  if (tasks.length === 0) return null;

  // 7. Build entity queue assignments
  const entityUpdates = new Map<EntityId, Partial<Entity>>();
  const entityTaskChains = new Map<EntityId, string[]>();

  for (const task of tasks) {
    for (const eid of task.assignedIds) {
      const chain = entityTaskChains.get(eid) ?? [];
      chain.push(task.id);
      entityTaskChains.set(eid, chain);
    }
  }

  for (const [eid, taskIds] of entityTaskChains) {
    entityUpdates.set(eid, {
      currentTaskId: taskIds[0],
      taskQueue: taskIds.slice(1),
    });
  }

  // Activate the first tasks
  for (const task of tasks) {
    for (const eid of task.assignedIds) {
      const chain = entityTaskChains.get(eid);
      if (chain && chain[0] === task.id) {
        (task as any).status = 'ACTIVE';
        (task as any).activatedAt = state.time.elapsed;
        break;
      }
    }
  }

  return { tasks, entityUpdates };
}
