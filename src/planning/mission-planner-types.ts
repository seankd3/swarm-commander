// --- Mission Planner Types ---
// Type definitions for the simplified 3-step mission planner.

import type { Capability, CapabilityRequirement } from './capabilities';
import type {
  Position,
  EntityId,
  TaskParams,
  RadarMode,
  ROE,
  CompletionCondition,
  TaskType,
  AreaDef,
} from '../simulation/types';

// ===== TRADEOFF PROFILE =====

/** Tradeoff ratings shown as bars in the approach selection UI */
export interface TradeoffProfile {
  speed: number;        // 1-5: how fast to complete
  stealth: number;      // 1-5: how invisible to enemy
  fuelCost: number;     // 1-5: how much fuel consumed
  risk: number;         // 1-5: expected attrition
  complexity: number;   // 1-5: how many moving parts
  intel: number;        // 1-5: how much you learn before engaging
}

// ===== MISSION TYPE =====

export interface MissionTypeDef {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'offensive' | 'defensive' | 'support';
  requirements: CapabilityRequirement[];
  approachIds: string[];
}

// ===== APPROACH VARIANT =====

export interface ApproachVariantDef {
  id: string;
  name: string;
  description: string;
  tradeoffs: TradeoffProfile;
  defaultParams: Partial<TaskParams>;
  extraRequirements?: CapabilityRequirement[];
  roles: RoleDef[];
  taskGeneratorId: string;
}

/** A role within an approach — how assets get divided */
export interface RoleDef {
  id: string;
  name: string;
  description: string;
  requiredCapabilities: Capability[];
  minCount: number;
  maxCount: number;     // -1 = unlimited
  suggestedCount: number;
}

// ===== TASK TEMPLATE =====

/** Template for a task to be materialized by the generator */
export interface TaskTemplate {
  type: TaskType;
  params?: Partial<TaskParams>;
  completionCondition?: CompletionCondition;
  destination?: Position;
  area?: AreaDef;
  contactId?: string;
  baseId?: EntityId | null;
}

// ===== MISSION CONFIG (final output before launch) =====

export interface MissionConfig {
  committedEntityIds: EntityId[];
  missionTypeId: string;
  approachId: string;
  roleAssignments: Map<string, EntityId[]>;
  targetPosition: Position;
  targetRadius: number;
  overrides: MissionOverrides;
}

export interface MissionOverrides {
  roleRadarModes: Map<string, RadarMode>;
  roleSpeedFractions: Map<string, number>;
  roleROEs: Map<string, ROE>;
  ingressPoint: Position | null;
  egressPoint: Position | null;
  launchStagger: number;
  altitudePreference: 'HIGH' | 'MEDIUM' | 'LOW';
  autoRtb: boolean;
}

// ===== PLANNER STATE (simplified 3-step) =====

export type PlannerStep = 1 | 2 | 3;

export interface PlannerState {
  step: PlannerStep;
  selectedMissionType: string | null;        // mission type ID
  targetPosition: Position | null;
  ingressPoint: Position | null;
  egressPoint: Position | null;
}

export function createDefaultOverrides(): MissionOverrides {
  return {
    roleRadarModes: new Map(),
    roleSpeedFractions: new Map(),
    roleROEs: new Map(),
    ingressPoint: null,
    egressPoint: null,
    launchStagger: 0,
    altitudePreference: 'HIGH',
    autoRtb: true,
  };
}

export function createInitialPlannerState(): PlannerState {
  return {
    step: 1,
    selectedMissionType: null,
    targetPosition: null,
    ingressPoint: null,
    egressPoint: null,
  };
}
