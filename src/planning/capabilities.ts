// --- Capability Query System ---
// Derives abstract capabilities from PlatformDef components.
// No hardcoded platform IDs — new platforms auto-slot into missions.

import type { PlatformDef } from '../platforms/platform-types';
import { getPlatform } from '../platforms/platform-registry';

export type Capability =
  | 'LONG_RANGE_SENSOR'   // sensor.range >= 15000m
  | 'SHORT_RANGE_SENSOR'  // sensor.range > 0 && < 15000m
  | 'HAS_SENSOR'          // sensor !== undefined
  | 'HAS_WEAPON'          // weapon !== undefined
  | 'SUICIDE_STRIKE'      // weapon.type === 'SUICIDE'
  | 'STANDOFF_WEAPON'     // weapon.type === 'MISSILE' or 'GUN'
  | 'HAS_ARM'             // weapon.type === 'ANTI_RADIATION'
  | 'HAS_CRUISE_MISSILE'  // weapon.type === 'CRUISE_MISSILE'
  | 'LOW_OBSERVABLE'       // very low RCS (stealth)
  | 'EMISSION_HOMING'     // weapon.guidanceType === 'EMISSION_HOMING'
  | 'HIGH_SPEED'          // movement.maxSpeed >= 77 m/s (~150kts)
  | 'LOW_SPEED'           // movement exists but < 77 m/s
  | 'HAS_MOVEMENT'        // movement !== undefined
  | 'LONG_ENDURANCE'      // fuel endurance >= 3hrs
  | 'SHORT_ENDURANCE'     // fuel endurance < 3hrs
  | 'IS_BASE'             // base !== undefined
  | 'CAN_FLY'             // category === 'AIR'
  | 'IS_GROUND';          // category === 'GROUND'

const LONG_RANGE_THRESHOLD = 15000; // meters
const HIGH_SPEED_THRESHOLD = 77;    // m/s (~150 kts)
const LONG_ENDURANCE_HOURS = 3;

/** Derive capabilities from a PlatformDef */
export function getCapabilities(def: PlatformDef): Set<Capability> {
  const caps = new Set<Capability>();

  if (def.category === 'AIR') caps.add('CAN_FLY');
  if (def.category === 'GROUND') caps.add('IS_GROUND');

  if (def.sensor) {
    caps.add('HAS_SENSOR');
    if (def.sensor.range >= LONG_RANGE_THRESHOLD) caps.add('LONG_RANGE_SENSOR');
    else caps.add('SHORT_RANGE_SENSOR');
  }

  if (def.weapon) {
    caps.add('HAS_WEAPON');
    if (def.weapon.type === 'SUICIDE') caps.add('SUICIDE_STRIKE');
    if (def.weapon.type === 'MISSILE' || def.weapon.type === 'GUN') caps.add('STANDOFF_WEAPON');
    if (def.weapon.type === 'ANTI_RADIATION') {
      caps.add('HAS_ARM');
      caps.add('EMISSION_HOMING');
    }
    if (def.weapon.type === 'CRUISE_MISSILE') caps.add('HAS_CRUISE_MISSILE');
  }

  if (def.movement) {
    caps.add('HAS_MOVEMENT');
    if (def.movement.maxSpeed >= HIGH_SPEED_THRESHOLD) caps.add('HIGH_SPEED');
    else caps.add('LOW_SPEED');
  }

  if (def.fuel) {
    const enduranceHrs = def.fuel.capacity / def.fuel.burnRateCruise / 3600;
    if (enduranceHrs >= LONG_ENDURANCE_HOURS) caps.add('LONG_ENDURANCE');
    else caps.add('SHORT_ENDURANCE');
  }

  if (def.base) caps.add('IS_BASE');

  // Stealth: platforms with low radar cross section
  if (def.radarCrossSection !== undefined && def.radarCrossSection <= 0.2) {
    caps.add('LOW_OBSERVABLE');
  }

  return caps;
}

/** A requirement: at least `min` committed assets must each have ALL capabilities in `any` */
export interface CapabilityRequirement {
  any: Capability[];
  min?: number; // default 1
}

/** Check if committed platform IDs collectively satisfy all requirements */
export function satisfiesRequirements(
  committedPlatformIds: string[],
  requirements: CapabilityRequirement[],
): boolean {
  for (const req of requirements) {
    const min = req.min ?? 1;
    let matchCount = 0;
    for (const pid of committedPlatformIds) {
      const caps = getCapabilities(getPlatform(pid));
      if (req.any.every(c => caps.has(c))) matchCount++;
    }
    if (matchCount < min) return false;
  }
  return true;
}

/** Get capabilities for a platformId string */
export function getPlatformCapabilities(platformId: string): Set<Capability> {
  return getCapabilities(getPlatform(platformId));
}
