// --- Red Ground Platforms ---
// Iranian IADS: S-300PMU2, Mersad, Tor-M1, Surveillance Radar, Command Post

import type { PlatformDef } from '../platform-types';

export const S300_PMU2: PlatformDef = {
  id: 'S300_PMU2',
  name: 'S-300PMU2 Battery',
  label: 'S300',
  category: 'GROUND',
  description: 'Long-range strategic SAM — 200km tracking, 150km engagement. Iran\'s primary area denial system.',
  health: 150,

  // No movement — fixed installation
  sensor: {
    type: 'RADAR',
    range: 200000,        // 200km tracking (30N6E2 Flap Lid FCR)
    fieldOfView: 90,      // Phased array sector
    rotationSpeed: 6,     // Slow reorientation
    displayName: '30N6E2 Flap Lid FCR',
  },
  weapon: {
    type: 'MISSILE',
    range: 150000,        // 150km engagement (48N6E2)
    damage: 100,          // Devastating proximity fuse
    reloadTime: 5,        // Rapid salvo
    ammoCapacity: -1,     // Unlimited (full battery)
    missileSpeed: 2000,   // Mach 6
    displayName: '48N6E2 SAM',
  },

  render: {
    drawFn: 'sam-launcher',
    color: '#E76A6E',
    glowColor: 'rgba(231, 106, 110, 0.4)',
    size: 10,
  },
};

export const MERSAD_SAM: PlatformDef = {
  id: 'MERSAD_SAM',
  name: 'Mersad SAM Battery',
  label: 'MRSD',
  category: 'GROUND',
  description: 'Medium-range Iranian-built Hawk derivative — 100km tracking, 50km engagement.',
  health: 80,

  sensor: {
    type: 'RADAR',
    range: 100000,        // 100km tracking
    fieldOfView: 60,
    rotationSpeed: 12,
    displayName: 'Hawk Illumination Radar',
  },
  weapon: {
    type: 'MISSILE',
    range: 50000,         // 50km (Sayyad-2)
    damage: 60,
    reloadTime: 10,
    ammoCapacity: -1,
    missileSpeed: 900,    // Mach 2.5
    displayName: 'Sayyad-2 SAM',
  },

  render: {
    drawFn: 'sam-launcher',
    color: '#E76A6E',
    glowColor: 'rgba(231, 106, 110, 0.4)',
    size: 8,
  },
};

export const TOR_M1: PlatformDef = {
  id: 'TOR_M1',
  name: 'Tor-M1 SAM',
  label: 'TOR',
  category: 'GROUND',
  description: 'Short-range point defense SAM — fully autonomous with 360° radar. 25km detection, 12km engagement.',
  health: 60,

  sensor: {
    type: 'RADAR',
    range: 25000,         // 25km detection
    fieldOfView: 360,     // Omnidirectional
    rotationSpeed: 0,     // 360° = always on
    displayName: 'Tor-M1 Tracking Radar',
  },
  weapon: {
    type: 'MISSILE',
    range: 12000,         // 12km (9M331)
    damage: 40,
    reloadTime: 3,        // Rapid salvo
    ammoCapacity: -1,
    missileSpeed: 850,
    displayName: '9M331 SAM',
  },

  render: {
    drawFn: 'mobile-sam',
    color: '#E76A6E',
    glowColor: 'rgba(231, 106, 110, 0.4)',
    size: 7,
  },
};

export const SURVEILLANCE_RADAR: PlatformDef = {
  id: 'SURVEILLANCE_RADAR',
  name: 'Surveillance Radar',
  label: 'SRDR',
  category: 'GROUND',
  description: 'Long-range early warning radar — 400km omnidirectional detection. No weapon. Destroying it degrades IADS awareness.',
  health: 80,

  sensor: {
    type: 'RADAR',
    range: 400000,        // 400km (Ghadir-class)
    fieldOfView: 360,     // Omnidirectional
    rotationSpeed: 0,
    displayName: 'Ghadir Surveillance Radar',
  },
  // No weapon

  render: {
    drawFn: 'ew-radar',
    color: '#E76A6E',
    glowColor: 'rgba(231, 106, 110, 0.4)',
    size: 12,
  },
};

export const COMMAND_POST: PlatformDef = {
  id: 'COMMAND_POST',
  name: 'Command Post',
  label: 'CP',
  category: 'GROUND',
  description: 'Enemy command and control node — high-value target',
  health: 150,

  // No movement, no sensor, no weapon — pure HVT
  render: {
    drawFn: 'command-post',
    color: '#E76A6E',
    glowColor: 'rgba(231, 106, 110, 0.4)',
    size: 10,
  },
};

export const RED_GROUND_PLATFORMS: PlatformDef[] = [S300_PMU2, MERSAD_SAM, TOR_M1, SURVEILLANCE_RADAR, COMMAND_POST];
