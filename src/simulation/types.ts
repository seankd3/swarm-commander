// --- Core Types ---
// All simulation types. No rendering dependencies.

/** Geographic position in WGS84 coordinates */
export interface Position {
  lat: number; // degrees (-90 to 90)
  lon: number; // degrees (-180 to 180)
}

/** Heading and speed */
export interface Velocity {
  heading: number; // degrees (0 = north, 90 = east, clockwise)
  speed: number; // meters per second
}

/** Unique identifier for entities */
export type EntityId = string;

/** Radar emission mode — controls detectability vs sensor capability */
export type RadarMode = 'ACTIVE' | 'PASSIVE';

/** Radar cross-section multipliers — how radar mode affects detection range against you */
export const RADAR_CROSS_SECTION: Record<RadarMode, number> = {
  ACTIVE: 2.0,    // Emitting radar doubles detection range against you
  PASSIVE: 0.5,   // Radar off, harder to detect
};

/** Faction */
export type Faction = 'BLUE' | 'RED';

/** Current behavioral state */
export type EntityState =
  | 'IDLE'
  | 'TRANSIT'
  | 'ORBITING'
  | 'ATTACKING'
  | 'DESTROYED';

/** Flight lifecycle state */
export type FlightState =
  | 'GROUNDED'    // ground/naval units — no flight ops
  | 'PARKED'      // at base, no fuel burn, hidden from map
  | 'LAUNCHING'   // takeoff roll, accelerating
  | 'AIRBORNE'    // normal flight, fuel burning
  | 'RECOVERING'; // approach + landing

/** Runtime fuel state (populated from PlatformDef.fuel at creation) */
export interface FuelState {
  remaining: number;   // liters remaining
  capacity: number;    // max liters
  isBingo: boolean;    // true when remaining <= capacity * bingoPercent
}

/** Runtime ammo state (populated from PlatformDef.weapon at creation) */
export interface AmmoState {
  remaining: number;   // rounds remaining
  capacity: number;    // max rounds (-1 = unlimited)
}

/** Runtime base state (for entities with BaseComponent) */
export interface BaseState {
  parkedAircraft: EntityId[];  // IDs of parked aircraft
  launchQueue: EntityId[];     // IDs waiting to launch
  lastLaunchTime: number;      // game time
  lastRecoveryTime: number;    // game time
}

/** Sensor definition */
export interface Sensor {
  type: 'CAMERA' | 'RADAR';
  range: number; // meters
  fieldOfView: number; // degrees (360 = omnidirectional)
  currentAngle: number; // degrees, direction sensor is pointing (relative to entity heading)
  rotationSpeed: number; // degrees per second (0 = fixed)
}

/** A game entity */
export interface Entity {
  id: EntityId;
  platformId: string;       // references PlatformDef.id — the canonical platform key
  type: string;             // backward compat alias (= platformId for now)
  faction: Faction;
  position: Position;
  velocity: Velocity;
  heading: number; // facing direction in degrees
  state: EntityState;
  health: number; // 0 = destroyed
  maxHealth: number;
  maxSpeed: number; // meters per second
  destination: Position | null;
  target: EntityId | null; // for attack orders
  sensor: Sensor | null;
  isDetected: boolean; // has enemy detected this entity?
  detectedBy: EntityId[]; // which enemy sensors see this
  taskQueue: string[];              // ordered list of pending task IDs
  currentTaskId: string | null;     // currently executing task ID
  lastFireTime: number; // game time of last weapon fire (SAM)
  radarMode: RadarMode; // current radar emission state
  rcs: number; // radar cross section from PlatformDef.radarCrossSection (0.0-1.0+, default 1.0)

  // Flight ops
  flightState: FlightState;
  homeBaseId: EntityId | null;  // base this aircraft belongs to
  fuelState: FuelState | null;  // null = no fuel system (ground units)
  baseState: BaseState | null;  // null = not a base
  tag: string | null;           // scenario objective tag (e.g. 'obj-radar-1')

  // Weapon state
  ammoState: AmmoState | null;  // null = no weapon or unlimited ammo
  orbitRadius: number | null;   // meters — radius for ORBITING state (null = not orbiting)
}

// --- Sensor Contacts (shared fused picture) ---

/** A sensor contact — represents a detected entity in the shared COP */
export interface Contact {
  id: string;
  entityId: EntityId; // the actual entity this refers to
  position: Position; // last known position
  entityType: string | null; // platform ID classification (null = unclassified)
  faction: Faction;
  firstDetected: number; // game time
  lastSeen: number; // game time
  isLive: boolean; // currently in a sensor cone
}

/** How long contacts persist after losing sensor coverage (seconds) */
export const CONTACT_PERSISTENCE = 30;

// --- Missiles (all projectile types: SAMs, cruise missiles, ARMs) ---

import type { GuidanceType } from '../platforms/platform-types';

export interface Missile {
  id: string;
  position: Position;
  targetId: EntityId;
  speed: number; // m/s
  heading: number;
  launchedBy: EntityId;
  faction: Faction;                    // which side launched this
  guidanceType: GuidanceType;          // how this missile tracks
  damage: number;                      // hit points on impact
  lastKnownTargetPos: Position | null; // fallback if guidance loses lock
}

// --- Task System (Lattice-inspired mission autonomy) ---

export type TaskType = 'MOVE_TO' | 'RECON_AREA' | 'STRIKE_ON_DETECT' | 'PATROL' | 'STRIKE_TARGET'
  | 'TAKEOFF' | 'LAND' | 'RTB'
  | 'FIRE_CRUISE_MISSILE' | 'FIRE_ARM' | 'REARM' | 'ORBIT';

export type TaskStatus = 'QUEUED' | 'ACTIVE' | 'COMPLETE' | 'FAILED';

/** Rules of Engagement — controls autonomous engagement behavior */
export type ROE = 'WEAPONS_HOLD' | 'WEAPONS_TIGHT' | 'WEAPONS_FREE';

/** Formation geometry for grouped movement */
export type FormationType = 'NONE' | 'LINE' | 'COLUMN' | 'WEDGE';

/** Behavioral parameters embedded in every task (the "mission order") */
export interface TaskParams {
  roe: ROE;
  formation: FormationType;
  spacing: number;        // meters between units in formation (500-4000)
  speedFraction: number;  // 0.0-1.0, fraction of maxSpeed
  radarMode: RadarMode;   // sensor emission mode
}

/** Sensible defaults per task type */
export const TASK_DEFAULTS: Record<TaskType, TaskParams> = {
  MOVE_TO:          { roe: 'WEAPONS_HOLD',  formation: 'LINE',   spacing: 2000, speedFraction: 0.8, radarMode: 'ACTIVE' },
  RECON_AREA:       { roe: 'WEAPONS_HOLD',  formation: 'LINE',   spacing: 2000, speedFraction: 0.7, radarMode: 'ACTIVE' },
  PATROL:           { roe: 'WEAPONS_TIGHT', formation: 'WEDGE',  spacing: 1000, speedFraction: 0.6, radarMode: 'ACTIVE' },
  STRIKE_ON_DETECT: { roe: 'WEAPONS_FREE',  formation: 'COLUMN', spacing: 500,  speedFraction: 1.0, radarMode: 'PASSIVE' },
  STRIKE_TARGET:    { roe: 'WEAPONS_FREE',  formation: 'COLUMN', spacing: 500,  speedFraction: 1.0, radarMode: 'PASSIVE' },
  TAKEOFF:          { roe: 'WEAPONS_HOLD',  formation: 'NONE',   spacing: 0,    speedFraction: 1.0, radarMode: 'PASSIVE' },
  LAND:             { roe: 'WEAPONS_HOLD',  formation: 'NONE',   spacing: 0,    speedFraction: 0.5, radarMode: 'ACTIVE' },
  RTB:              { roe: 'WEAPONS_HOLD',  formation: 'NONE',   spacing: 0,    speedFraction: 0.8, radarMode: 'ACTIVE' },
  FIRE_CRUISE_MISSILE: { roe: 'WEAPONS_FREE', formation: 'NONE', spacing: 0,    speedFraction: 0.6, radarMode: 'PASSIVE' },
  FIRE_ARM:         { roe: 'WEAPONS_FREE',  formation: 'NONE',   spacing: 0,    speedFraction: 0.8, radarMode: 'PASSIVE' },
  REARM:            { roe: 'WEAPONS_HOLD',  formation: 'NONE',   spacing: 0,    speedFraction: 0,   radarMode: 'PASSIVE' },
  ORBIT:            { roe: 'WEAPONS_HOLD',  formation: 'NONE',   spacing: 0,    speedFraction: 0.6, radarMode: 'ACTIVE' },
};

/** Completion condition — determines when a task is done */
export type CompletionCondition =
  | { type: 'ARRIVAL' }
  | { type: 'FLIGHT_STATE'; target: FlightState }
  | { type: 'DURATION'; seconds: number }
  | { type: 'ON_DETECT'; count?: number }
  | { type: 'ALL_ENGAGED' }
  | { type: 'TARGET_DESTROYED'; entityId: EntityId };

/** An area defined by center + radius */
export interface AreaDef {
  center: Position;
  radius: number; // meters
}

/** Base task fields — every task is a complete mission order */
interface TaskBase {
  id: string;
  assignedIds: EntityId[];
  status: TaskStatus;
  completionCondition: CompletionCondition;
  createdAt: number;          // game time
  activatedAt: number | null; // game time when ACTIVE (null if QUEUED)
  params: TaskParams;         // behavioral configuration
}

/** Move to a position — one-shot transit task, completes on arrival */
export interface MoveToTask extends TaskBase {
  type: 'MOVE_TO';
  destination: Position;
}

/** Recon an area — SPECTERs fly search pattern and report contacts */
export interface ReconAreaTask extends TaskBase {
  type: 'RECON_AREA';
  area: AreaDef;
}

/** Strike targets on detection — HORNETs auto-engage when contacts appear */
export interface StrikeOnDetectTask extends TaskBase {
  type: 'STRIKE_ON_DETECT';
  watchArea?: AreaDef; // optional AO to scope WEAPONS_TIGHT engagement
}

/** Patrol an area — units orbit around the area continuously */
export interface PatrolTask extends TaskBase {
  type: 'PATROL';
  area: AreaDef;
}

/** Strike a specific known contact */
export interface StrikeTargetTask extends TaskBase {
  type: 'STRIKE_TARGET';
  contactId: string;
}

/** Takeoff from a base — aircraft transitions PARKED → LAUNCHING → AIRBORNE */
export interface TakeoffTask extends TaskBase {
  type: 'TAKEOFF';
  baseId: EntityId;
}

/** Land at a base — aircraft transitions AIRBORNE → RECOVERING → PARKED */
export interface LandTask extends TaskBase {
  type: 'LAND';
  baseId: EntityId;
}

/** Return to base — fly to nearest/specified base, then auto-queue LAND */
export interface RTBTask extends TaskBase {
  type: 'RTB';
  baseId: EntityId | null; // null = nearest
}

/** Fire cruise missile at a contact/position — bomber standoff strike */
export interface FireCruiseMissileTask extends TaskBase {
  type: 'FIRE_CRUISE_MISSILE';
  targetContactId: string;             // contact to strike
  targetPosition: Position;            // initial target position
  standoffPosition: Position;          // where to orbit while firing
}

/** Fire anti-radiation missile at an emitter — SEAD hunter */
export interface FireArmTask extends TaskBase {
  type: 'FIRE_ARM';
  targetEntityId: EntityId;            // emitter to target
  targetPosition: Position;            // position of emitter
  approachPosition: Position;          // where to fly before firing
}

/** Rearm at base — refill ammo over time */
export interface RearmTask extends TaskBase {
  type: 'REARM';
  baseId: EntityId;
}

/** Orbit at a position — hold pattern */
export interface OrbitTask extends TaskBase {
  type: 'ORBIT';
  center: Position;
  radius: number; // meters
}

export type Task = MoveToTask | ReconAreaTask | StrikeOnDetectTask | PatrolTask | StrikeTargetTask
  | TakeoffTask | LandTask | RTBTask
  | FireCruiseMissileTask | FireArmTask | RearmTask | OrbitTask;

// --- Time ---

/** Time speed multipliers */
export type TimeSpeed = 0 | 1 | 5 | 20;

/** Time state */
export interface TimeState {
  elapsed: number;
  missionDuration: number;
  speed: TimeSpeed;
  previousSpeed: TimeSpeed;
}

// --- Selection & UI ---

/** Selection state */
export interface SelectionState {
  selectedIds: Set<EntityId>;
  boxStart: { x: number; y: number } | null;
  boxEnd: { x: number; y: number } | null;
}

/** Mission outcome */
export type MissionResult = 'PENDING' | 'VICTORY' | 'DEFEAT';

/** In-game notification */
export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

/** Game event category for the intel event feed */
export type GameEventCategory = 'DETECTION' | 'ENGAGEMENT' | 'DESTRUCTION' | 'MISSION' | 'FUEL' | 'AMMO';

/** A game event for the live intel feed */
export interface GameEvent {
  id: string;
  timestamp: number;          // game time
  category: GameEventCategory;
  message: string;
  entityId?: EntityId;        // primary entity involved
  position?: Position;        // where it happened
}

/** Objective definition (from scenario) */
export interface ObjectiveDef {
  entityTag: string;
  label: string;
  type: 'DESTROY';
}

/** Complete game state */
export interface GameState {
  time: TimeState;
  entities: Map<EntityId, Entity>;
  contacts: Map<string, Contact>;
  missiles: Missile[];
  tasks: Task[];
  selection: SelectionState;
  missionResult: MissionResult;
  notifications: Notification[];
  events: GameEvent[];

  // Scenario-driven mission data
  objectives: ObjectiveDef[];
  defeatCondition: 'ALL_BLUE_DEAD' | 'TIME_EXPIRED' | 'BOTH';
  victoryText: string;
  defeatText: string;

  // Play area bounds (from scenario config)
  playArea: { north: number; south: number; east: number; west: number } | null;
}

// --- Constants ---

/** Nautical mile in meters */
export const NM_TO_METERS = 1852;

/** Knot in meters per second */
export const KNOT_TO_MS = 0.514444;

/** Mission specs */
export const MISSION_SPECS = {
  duration: 20 * 60, // 20 minutes
} as const;
