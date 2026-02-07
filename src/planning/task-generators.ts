// --- Task Generator System ---
// Translates MissionConfig into Task[] arrays ready for injection into GameState.
// Each approach variant maps to a generator function via taskGeneratorId.
// 6 generators: gen-recon-area, gen-recon-standoff, gen-strike-penetrate,
// gen-strike-standoff, gen-sead-standoff, gen-sead-penetrate

import type {
  Task,
  TaskParams,
  Position,
  EntityId,
  Entity,
  GameState,
} from '../simulation/types';
import type { MissionConfig, MissionOverrides, ApproachVariantDef } from './mission-planner-types';
import { getApproachVariant } from './approach-variants';
import { movePosition, bearingDegrees } from '../simulation/geo';
import { getPlatform } from '../platforms/platform-registry';

let taskCounter = 0;
function mkTaskId(): string {
  return `mission-${Date.now()}-${++taskCounter}`;
}

/** Build TaskParams for a specific role, merging approach defaults with overrides */
function buildRoleParams(
  approach: ApproachVariantDef,
  roleId: string,
  overrides: MissionOverrides,
): TaskParams {
  const base: TaskParams = {
    roe: approach.defaultParams.roe ?? 'WEAPONS_HOLD',
    formation: approach.defaultParams.formation ?? 'LINE',
    spacing: approach.defaultParams.spacing ?? 2000,
    speedFraction: approach.defaultParams.speedFraction ?? 0.8,
    radarMode: approach.defaultParams.radarMode ?? 'ACTIVE',
  };

  // Apply per-role overrides
  if (overrides.roleROEs.has(roleId)) base.roe = overrides.roleROEs.get(roleId)!;
  if (overrides.roleRadarModes.has(roleId)) base.radarMode = overrides.roleRadarModes.get(roleId)!;
  if (overrides.roleSpeedFractions.has(roleId)) base.speedFraction = overrides.roleSpeedFractions.get(roleId)!;

  // Altitude affects speed
  if (overrides.altitudePreference === 'LOW') {
    base.speedFraction = Math.min(base.speedFraction, 0.7);
  }

  return base;
}

/** Find home base for an entity */
function findHomeBase(entityId: EntityId, state: GameState): EntityId | null {
  const entity = state.entities.get(entityId);
  if (!entity) return null;
  if (entity.homeBaseId) return entity.homeBaseId;

  // Find nearest friendly base
  let bestId: EntityId | null = null;
  let bestDist = Infinity;
  for (const [id, e] of state.entities) {
    if (e.faction !== entity.faction || e.state === 'DESTROYED') continue;
    const plat = getPlatform(e.platformId);
    if (!plat.base) continue;
    const dlat = e.position.lat - entity.position.lat;
    const dlon = e.position.lon - entity.position.lon;
    const dist = dlat * dlat + dlon * dlon;
    if (dist < bestDist) { bestDist = dist; bestId = id; }
  }
  return bestId;
}

/** Check if entity is parked and needs takeoff */
function needsTakeoff(entity: Entity): boolean {
  return entity.flightState === 'PARKED';
}

/** Generate tasks for a mission config */
export function generateMissionTasks(config: MissionConfig, state: GameState): Task[] {
  const approach = getApproachVariant(config.approachId);
  if (!approach) return [];

  const gen = GENERATORS.get(approach.taskGeneratorId);
  if (!gen) return [];

  return gen(config, approach, state);
}

// --- Generator Registry ---

type GeneratorFn = (config: MissionConfig, approach: ApproachVariantDef, state: GameState) => Task[];
const GENERATORS = new Map<string, GeneratorFn>();

function registerGenerator(id: string, fn: GeneratorFn): void {
  GENERATORS.set(id, fn);
}

// --- Helper: Create bookend tasks (takeoff, RTB, land) ---

function createTakeoffTasks(
  entityIds: EntityId[],
  baseId: EntityId,
  gameTime: number,
): Task[] {
  const paramsHold: TaskParams = { roe: 'WEAPONS_HOLD', formation: 'NONE', spacing: 0, speedFraction: 1.0, radarMode: 'PASSIVE' };
  const id = mkTaskId();
  return [{
    type: 'TAKEOFF',
    id,
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'FLIGHT_STATE', target: 'AIRBORNE' },
    createdAt: gameTime,
    activatedAt: null,
    params: paramsHold,
    baseId,
  }];
}

function createRtbLandTasks(
  entityIds: EntityId[],
  baseId: EntityId | null,
  gameTime: number,
): Task[] {
  const rtbId = mkTaskId();
  const landId = mkTaskId();
  const paramsHold: TaskParams = { roe: 'WEAPONS_HOLD', formation: 'NONE', spacing: 0, speedFraction: 0.8, radarMode: 'ACTIVE' };
  return [
    {
      type: 'RTB',
      id: rtbId,
      assignedIds: entityIds,
      status: 'QUEUED',
      completionCondition: { type: 'ARRIVAL' },
      createdAt: gameTime,
      activatedAt: null,
      params: paramsHold,
      baseId,
    },
    {
      type: 'LAND',
      id: landId,
      assignedIds: entityIds,
      status: 'QUEUED',
      completionCondition: { type: 'FLIGHT_STATE', target: 'PARKED' },
      createdAt: gameTime,
      activatedAt: null,
      params: { ...paramsHold, speedFraction: 0.5 },
      baseId: baseId ?? '' as EntityId,
    },
  ];
}

function createMoveToTask(
  entityIds: EntityId[],
  destination: Position,
  params: TaskParams,
  gameTime: number,
): Task {
  return {
    type: 'MOVE_TO',
    id: mkTaskId(),
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'ARRIVAL' },
    createdAt: gameTime,
    activatedAt: null,
    params,
    destination,
  };
}

function createReconTask(
  entityIds: EntityId[],
  center: Position,
  radius: number,
  params: TaskParams,
  durationSec: number,
  gameTime: number,
): Task {
  return {
    type: 'RECON_AREA',
    id: mkTaskId(),
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'DURATION', seconds: durationSec },
    createdAt: gameTime,
    activatedAt: null,
    params,
    area: { center, radius },
  };
}

function createPatrolTask(
  entityIds: EntityId[],
  center: Position,
  radius: number,
  params: TaskParams,
  durationSec: number,
  gameTime: number,
): Task {
  return {
    type: 'PATROL',
    id: mkTaskId(),
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'DURATION', seconds: durationSec },
    createdAt: gameTime,
    activatedAt: null,
    params,
    area: { center, radius },
  };
}

function createStrikeOnDetectTask(
  entityIds: EntityId[],
  center: Position,
  radius: number,
  params: TaskParams,
  gameTime: number,
): Task {
  return {
    type: 'STRIKE_ON_DETECT',
    id: mkTaskId(),
    assignedIds: entityIds,
    status: 'QUEUED',
    completionCondition: { type: 'ALL_ENGAGED' },
    createdAt: gameTime,
    activatedAt: null,
    params,
    watchArea: { center, radius },
  };
}

// --- Build full task chain for a role with bookend logic ---

function buildRoleChain(
  roleEntityIds: EntityId[],
  coreTasks: Task[],
  config: MissionConfig,
  state: GameState,
): Task[] {
  const tasks: Task[] = [];
  const gameTime = state.time.elapsed;

  // Check if any entity in this role needs takeoff
  const needsLaunch = roleEntityIds.some(id => {
    const e = state.entities.get(id);
    return e && needsTakeoff(e);
  });

  if (needsLaunch) {
    const baseId = findHomeBase(roleEntityIds[0], state);
    if (baseId) {
      tasks.push(...createTakeoffTasks(roleEntityIds, baseId, gameTime));
    }
  }

  // Ingress waypoint
  if (config.overrides.ingressPoint) {
    const ingressParams: TaskParams = { roe: 'WEAPONS_HOLD', formation: 'COLUMN', spacing: 1000, speedFraction: 0.8, radarMode: 'PASSIVE' };
    tasks.push(createMoveToTask(roleEntityIds, config.overrides.ingressPoint, ingressParams, gameTime));
  }

  // Core mission tasks
  tasks.push(...coreTasks);

  // Egress waypoint
  if (config.overrides.egressPoint) {
    const egressParams: TaskParams = { roe: 'WEAPONS_HOLD', formation: 'NONE', spacing: 0, speedFraction: 0.8, radarMode: 'ACTIVE' };
    tasks.push(createMoveToTask(roleEntityIds, config.overrides.egressPoint, egressParams, gameTime));
  }

  // Auto-RTB
  if (config.overrides.autoRtb) {
    const baseId = findHomeBase(roleEntityIds[0], state);
    tasks.push(...createRtbLandTasks(roleEntityIds, baseId, gameTime));
  }

  return tasks;
}

// ========================================
// GENERATOR IMPLEMENTATIONS
// ========================================

// --- RECON generators ---

registerGenerator('gen-recon-area', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  if (scoutIds.length === 0) return [];
  const params = buildRoleParams(approach, 'scouts', config.overrides);
  const reconTask = createReconTask(scoutIds, config.targetPosition, config.targetRadius, params, 300, state.time.elapsed);
  return buildRoleChain(scoutIds, [reconTask], config, state);
});

registerGenerator('gen-recon-standoff', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  if (scoutIds.length === 0) return [];
  const params = buildRoleParams(approach, 'scouts', config.overrides);
  // Orbit at 1.5x target radius (standoff distance)
  const patrolTask = createPatrolTask(scoutIds, config.targetPosition, config.targetRadius * 1.5, params, 300, state.time.elapsed);
  return buildRoleChain(scoutIds, [patrolTask], config, state);
});

// --- STRIKE generators ---

// gen-strike-penetrate: ISR scouts (optional) + B-2 JDAM flies to target, drops on COP contacts
registerGenerator('gen-strike-penetrate', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  const strikerIds = config.roleAssignments.get('strikers') ?? [];
  const tasks: Task[] = [];
  const gameTime = state.time.elapsed;

  // Scouts: takeoff → move to AO → recon (active radar, 300s)
  if (scoutIds.length > 0) {
    const scoutParams = buildRoleParams(approach, 'scouts', config.overrides);
    scoutParams.radarMode = 'ACTIVE';
    scoutParams.speedFraction = 1.0;
    const scoutRecon = createReconTask(scoutIds, config.targetPosition, config.targetRadius, scoutParams, 300, gameTime);
    tasks.push(...buildRoleChain(scoutIds, [scoutRecon], config, state));
  }

  // Strikers: takeoff → move to standoff → strike on detect (passive for stealth)
  if (strikerIds.length > 0) {
    const strikerParams = buildRoleParams(approach, 'strikers', config.overrides);
    strikerParams.radarMode = 'PASSIVE';
    const baseEntity = state.entities.get(findHomeBase(strikerIds[0], state) ?? '');
    const approachBearing = baseEntity
      ? bearingDegrees(baseEntity.position, config.targetPosition)
      : 0;
    // Stage at 30km from target (outside most SAM envelopes but inside JDAM 28km... need to get closer)
    const stagingPos = movePosition(config.targetPosition, (approachBearing + 180) % 360, 30000);
    const moveTask = createMoveToTask(strikerIds, stagingPos, { ...strikerParams, roe: 'WEAPONS_HOLD' }, gameTime);
    const strikeTask = createStrikeOnDetectTask(strikerIds, config.targetPosition, 35000, { ...strikerParams, roe: 'WEAPONS_FREE' }, gameTime);
    tasks.push(...buildRoleChain(strikerIds, [moveTask, strikeTask], config, state));
  }

  return tasks;
});

// gen-strike-standoff: ISR scouts (optional) + B-2 JASSM fires from current position (925km range)
registerGenerator('gen-strike-standoff', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  const bomberIds = config.roleAssignments.get('bombers') ?? [];
  const tasks: Task[] = [];
  const gameTime = state.time.elapsed;

  // Scouts: recon the AO
  if (scoutIds.length > 0) {
    const scoutParams = buildRoleParams(approach, 'scouts', config.overrides);
    scoutParams.radarMode = 'ACTIVE';
    scoutParams.speedFraction = 1.0;
    const scoutRecon = createReconTask(scoutIds, config.targetPosition, config.targetRadius, scoutParams, 300, gameTime);
    tasks.push(...buildRoleChain(scoutIds, [scoutRecon], config, state));
  }

  // Bombers: strike on detect from current position — 925km JASSM-ER covers everything
  if (bomberIds.length > 0) {
    const bomberParams = buildRoleParams(approach, 'bombers', config.overrides);
    bomberParams.radarMode = 'PASSIVE';
    const strikeTask = createStrikeOnDetectTask(bomberIds, config.targetPosition, 1000000, { ...bomberParams, roe: 'WEAPONS_FREE' }, gameTime);
    tasks.push(...buildRoleChain(bomberIds, [strikeTask], config, state));
  }

  return tasks;
});

// --- SEAD generators ---

// gen-sead-standoff: ISR scouts find SAMs, B-2 JASSM destroys from standoff
registerGenerator('gen-sead-standoff', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  const bomberIds = config.roleAssignments.get('bombers') ?? [];
  const tasks: Task[] = [];
  const gameTime = state.time.elapsed;

  // Scouts: recon at safe standoff (outside S-300 150km weapon, inside GH 200km sensor)
  if (scoutIds.length > 0) {
    const scoutParams = buildRoleParams(approach, 'scouts', config.overrides);
    scoutParams.radarMode = 'ACTIVE';
    scoutParams.speedFraction = 1.0;
    const scoutRecon = createReconTask(scoutIds, config.targetPosition, config.targetRadius, scoutParams, 300, gameTime);
    tasks.push(...buildRoleChain(scoutIds, [scoutRecon], config, state));
  }

  // Bombers: strike on detect from current position — 925km JASSM-ER covers everything
  if (bomberIds.length > 0) {
    const bomberParams = buildRoleParams(approach, 'bombers', config.overrides);
    bomberParams.radarMode = 'PASSIVE';
    const strikeTask = createStrikeOnDetectTask(bomberIds, config.targetPosition, 1000000, { ...bomberParams, roe: 'WEAPONS_FREE' }, gameTime);
    tasks.push(...buildRoleChain(bomberIds, [strikeTask], config, state));
  }

  return tasks;
});

// gen-sead-penetrate: ISR scouts find SAMs, B-2 JDAM penetrates to bomb them
registerGenerator('gen-sead-penetrate', (config, approach, state) => {
  const scoutIds = config.roleAssignments.get('scouts') ?? [];
  const strikerIds = config.roleAssignments.get('strikers') ?? [];
  const tasks: Task[] = [];
  const gameTime = state.time.elapsed;

  // Scouts: recon to locate air defenses
  if (scoutIds.length > 0) {
    const scoutParams = buildRoleParams(approach, 'scouts', config.overrides);
    scoutParams.radarMode = 'ACTIVE';
    scoutParams.speedFraction = 1.0;
    const scoutRecon = createReconTask(scoutIds, config.targetPosition, config.targetRadius, scoutParams, 300, gameTime);
    tasks.push(...buildRoleChain(scoutIds, [scoutRecon], config, state));
  }

  // Strikers: move to standoff → strike on detect (passive for B-2 stealth)
  if (strikerIds.length > 0) {
    const strikerParams = buildRoleParams(approach, 'strikers', config.overrides);
    strikerParams.radarMode = 'PASSIVE';
    const baseEntity = state.entities.get(findHomeBase(strikerIds[0], state) ?? '');
    const approachBearing = baseEntity
      ? bearingDegrees(baseEntity.position, config.targetPosition)
      : 0;
    // Stage at 30km (outside most point-defense SAMs, close enough for JDAM 28km glide)
    const stagingPos = movePosition(config.targetPosition, (approachBearing + 180) % 360, 30000);
    const moveTask = createMoveToTask(strikerIds, stagingPos, { ...strikerParams, roe: 'WEAPONS_HOLD' }, gameTime);
    const strikeTask = createStrikeOnDetectTask(strikerIds, config.targetPosition, 35000, { ...strikerParams, roe: 'WEAPONS_FREE' }, gameTime);
    tasks.push(...buildRoleChain(strikerIds, [moveTask, strikeTask], config, state));
  }

  return tasks;
});
