// --- Blue Air Platforms ---
// RQ-4B Global Hawk (ISR), B-2 Spirit JDAM (penetration bomber), B-2 Spirit JASSM-ER (standoff bomber)

import type { PlatformDef } from '../platform-types';

export const RQ4_GLOBAL_HAWK: PlatformDef = {
  id: 'RQ4_GLOBAL_HAWK',
  name: 'RQ-4B Global Hawk',
  label: 'GHWK',
  category: 'AIR',
  description: 'High-altitude long-endurance ISR drone with AN/ZPY-2 MP-RTIP AESA radar',
  health: 40,
  radarCrossSection: 1.0, // Large, non-stealthy

  movement: {
    maxSpeed: 175,        // 340 kts
    cruiseSpeed: 160,     // 310 kts
    acceleration: 3,      // Slow, heavy
  },
  sensor: {
    type: 'RADAR',
    range: 200000,        // 200km GMTI range
    fieldOfView: 120,     // Forward-looking AESA
    rotationSpeed: 0,     // Fixed forward, aircraft orbits
    displayName: 'AN/ZPY-2 AESA',
  },
  // No weapon — ISR only
  fuel: {
    capacity: 9000,       // ~31 hours endurance
    burnRateCruise: 0.08,
    burnRateMax: 0.15,
    bingoPercent: 0.15,
  },

  render: {
    drawFn: 'specter',    // Reuse ISR drone shape
    color: '#4C90F0',
    glowColor: 'rgba(76, 144, 240, 0.4)',
    size: 8,
  },
};

export const B2_SPIRIT_JDAM: PlatformDef = {
  id: 'B2_SPIRIT_JDAM',
  name: 'B-2 Spirit (JDAM)',
  label: 'B2-J',
  category: 'AIR',
  description: 'Low-observable penetration bomber with GPS-guided glide bombs. Must fly deep inside enemy IADS.',
  health: 80,
  radarCrossSection: 0.1, // Very stealthy

  movement: {
    maxSpeed: 326,        // Mach 0.95
    cruiseSpeed: 291,     // Mach 0.85
    acceleration: 5,      // Heavy bomber
  },
  sensor: {
    type: 'RADAR',
    range: 80000,         // 80km weapon-delivery radar
    fieldOfView: 120,
    rotationSpeed: 0,
    displayName: 'AN/APQ-181 Radar',
  },
  weapon: {
    type: 'CRUISE_MISSILE', // Model JDAM as short-range cruise missile for game mechanics
    range: 28000,           // 28km glide from 40,000ft
    damage: 150,            // 2000lb bomb
    reloadTime: 3,          // Quick bay release
    ammoCapacity: 16,       // B-2 carries 16 GBU-31
    missileSpeed: 250,      // Glide terminal velocity
    guidanceType: 'FIRE_FORGET', // GPS/INS autonomous
    standoffRange: 20000,   // 20km minimum for glide
    displayName: 'GBU-31 JDAM',
  },
  fuel: {
    capacity: 75000,      // ~10.4 hours endurance
    burnRateCruise: 2.0,
    burnRateMax: 3.5,
    bingoPercent: 0.2,
  },

  render: {
    drawFn: 'stealth-bomber',
    color: '#7B68EE',
    glowColor: 'rgba(123, 104, 238, 0.4)',
    size: 10,
  },
};

export const B2_SPIRIT_JASSM: PlatformDef = {
  id: 'B2_SPIRIT_JASSM',
  name: 'B-2 Spirit (JASSM-ER)',
  label: 'B2-M',
  category: 'AIR',
  description: 'Low-observable standoff bomber firing cruise missiles from outside all threat rings.',
  health: 80,
  radarCrossSection: 0.1, // Very stealthy

  movement: {
    maxSpeed: 326,        // Mach 0.95
    cruiseSpeed: 291,     // Mach 0.85
    acceleration: 5,
  },
  sensor: {
    type: 'RADAR',
    range: 80000,         // 80km weapon-delivery radar
    fieldOfView: 120,
    rotationSpeed: 0,
    displayName: 'AN/APQ-181 Radar',
  },
  weapon: {
    type: 'CRUISE_MISSILE',
    range: 925000,        // 925km JASSM-ER range
    damage: 120,          // 450kg warhead
    reloadTime: 8,        // Slower bay release
    ammoCapacity: 16,     // B-2 internal capacity
    missileSpeed: 250,    // Mach 0.72 subsonic cruise
    guidanceType: 'FIRE_FORGET', // GPS/INS + IR seeker
    standoffRange: 500000, // 500km minimum fire distance
    displayName: 'AGM-158B JASSM-ER',
  },
  fuel: {
    capacity: 75000,
    burnRateCruise: 2.0,
    burnRateMax: 3.5,
    bingoPercent: 0.2,
  },

  render: {
    drawFn: 'stealth-bomber',
    color: '#7B68EE',
    glowColor: 'rgba(123, 104, 238, 0.4)',
    size: 10,
  },
};

export const BLUE_AIR_PLATFORMS: PlatformDef[] = [RQ4_GLOBAL_HAWK, B2_SPIRIT_JDAM, B2_SPIRIT_JASSM];
