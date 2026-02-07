// --- Platform Definition Types ---
// Static data describing what a platform IS. No runtime state here.
// Systems check for component presence to decide what logic applies.

/** Movement capability — entity can move */
export interface MovementComponent {
  maxSpeed: number;      // m/s
  cruiseSpeed: number;   // m/s (typical operating speed)
  acceleration: number;  // m/s^2
}

/** Sensor capability — entity can detect others */
export interface SensorComponent {
  type: 'CAMERA' | 'RADAR';
  range: number;         // meters
  fieldOfView: number;   // degrees (360 = omnidirectional)
  rotationSpeed: number; // degrees/sec (0 = fixed forward)
  displayName: string;   // e.g. 'AESA Radar', 'EO/IR Camera'
}

/** Weapon type — determines firing and guidance behavior */
export type WeaponType = 'SUICIDE' | 'MISSILE' | 'CRUISE_MISSILE' | 'ANTI_RADIATION' | 'GUN' | 'BOMB';

/** Guidance type — how a launched projectile tracks its target */
export type GuidanceType = 'FIRE_FORGET' | 'LATTICE_NETWORKED' | 'EMISSION_HOMING';

/** Weapon capability — entity can engage targets */
export interface WeaponComponent {
  type: WeaponType;
  range: number;              // meters (engagement range)
  damage: number;             // hit points per hit
  reloadTime: number;         // seconds between shots
  ammoCapacity: number;       // total rounds (-1 = unlimited, e.g. suicide)
  missileSpeed?: number;      // m/s (for projectile types: MISSILE, CRUISE_MISSILE, ANTI_RADIATION)
  guidanceType?: GuidanceType; // how projectile tracks (undefined = no projectile)
  standoffRange?: number;     // meters — minimum firing distance (standoff weapons fire from outside this)
  displayName: string;        // e.g. 'Terminal Strike', 'SA-15 Missile', 'Barracuda Cruise Missile'
}

/** Fuel capability — entity burns fuel (future: Phase 6) */
export interface FuelComponent {
  capacity: number;       // liters
  burnRateCruise: number; // liters/sec at cruise
  burnRateMax: number;    // liters/sec at max speed
  bingoPercent: number;   // 0-1, threshold for RTB warning
}

/** Base capability — entity can host/launch/recover aircraft (future: Phase 6) */
export interface BaseComponent {
  capacity: number;          // max parked aircraft
  launchInterval: number;    // seconds between launches
  recoveryInterval: number;  // seconds between recoveries
  baseType: 'AIRBASE' | 'CARRIER' | 'FARP';
}

/** Render hints — how to draw this platform */
export interface RenderComponent {
  drawFn: string;    // key into render registry (e.g. 'specter', 'radar-site')
  color: string;     // primary color
  glowColor: string; // glow/highlight color
  size: number;      // base render size in pixels
}

/** Complete platform definition — adding a platform = adding one of these */
export interface PlatformDef {
  id: string;                          // unique key: 'RQ4_GLOBAL_HAWK', 'S300_PMU2'
  name: string;                        // display: 'RQ-4B Global Hawk'
  label: string;                       // short (4 char): 'GHWK'
  category: 'AIR' | 'GROUND' | 'NAVAL';
  description: string;
  health: number;
  radarCrossSection?: number;          // 0.0-1.0+, default 1.0. Lower = stealthier.

  // Capability components — presence means the entity has this capability
  movement?: MovementComponent;
  sensor?: SensorComponent;
  weapon?: WeaponComponent;
  fuel?: FuelComponent;
  base?: BaseComponent;

  render: RenderComponent;
}
