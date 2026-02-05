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

/** Entity types in the game */
export type EntityType = 'MPA' | 'SUBMARINE';

/** Current behavioral state of an entity */
export type EntityState = 'IDLE' | 'TRANSIT' | 'PATROL' | 'SEARCH' | 'SNORKEL' | 'SILENT';

/** A game entity (aircraft, submarine, etc.) */
export interface Entity {
  id: EntityId;
  type: EntityType;
  position: Position;
  velocity: Velocity;
  state: EntityState;
  fuel: number; // seconds remaining
  maxSpeed: number; // meters per second
  destination: Position | null; // where it's heading, null if stationary
}

/** Time speed multipliers */
export type TimeSpeed = 0 | 1 | 5 | 20;

/** Time state */
export interface TimeState {
  elapsed: number; // seconds of game time elapsed
  missionDuration: number; // seconds total mission time
  speed: TimeSpeed; // current speed multiplier (0 = paused)
  previousSpeed: TimeSpeed; // speed before pause (for unpause toggle)
}

/** Complete game state — everything the simulation needs */
export interface GameState {
  time: TimeState;
  entities: Map<EntityId, Entity>;
}

/** Player input command */
export interface MoveCommand {
  type: 'MOVE';
  entityId: EntityId;
  target: Position;
}

export type Command = MoveCommand;

// --- Constants ---

/** Play area bounds: Philippine Sea, east of Luzon */
export const PLAY_AREA = {
  north: 16.0,
  south: 14.0,
  east: 128.0,
  west: 126.0,
} as const;

/** Nautical mile in meters */
export const NM_TO_METERS = 1852;

/** Knot in meters per second */
export const KNOT_TO_MS = 0.514444;

/** MPA specs (P-8 Poseidon based) */
export const MPA_SPECS = {
  maxSpeed: 250 * KNOT_TO_MS, // ~128.6 m/s
  cruiseSpeed: 200 * KNOT_TO_MS, // ~102.9 m/s
  fuelDuration: 4 * 3600, // 4 hours in seconds
} as const;

/** Mission 1 specs */
export const MISSION_SPECS = {
  duration: 2 * 3600, // 2 hours in seconds
} as const;
