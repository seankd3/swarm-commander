// --- Opening Strike ---
// Al Dhafra Air Base, UAE → Bandar Abbas, Iran (~390km)
// Penetrate a layered Iranian IADS to destroy the command post.

import type { ScenarioDef } from './scenario-types';

export const OPENING_STRIKE: ScenarioDef = {
  id: 'opening-strike',
  name: 'Opening Strike',
  description: 'Penetrate a layered Iranian IADS defending Bandar Abbas. Use Global Hawks for ISR, B-2s with JASSM-ER for standoff SEAD, then B-2 JDAM for the penetration kill on the command post.',
  duration: Infinity, // no time limit

  // Persian Gulf — Al Dhafra to Bandar Abbas
  mapCenter: { lat: 25.7, lon: 55.4 },
  mapZoom: 8,
  maxBounds: {
    north: 28.0,
    south: 23.5,
    east: 57.5,
    west: 53.5,
  },

  entities: [
    // --- BLUE ---
    {
      platformId: 'AIRBASE',
      faction: 'BLUE',
      position: { lat: 24.248, lon: 54.547 }, // Al Dhafra Air Base, UAE
      id: 'outpost-base',
    },
    // 2x RQ-4B Global Hawk — ISR
    ...Array.from({ length: 2 }, () => ({
      platformId: 'RQ4_GLOBAL_HAWK',
      faction: 'BLUE' as const,
      position: { lat: 24.248, lon: 54.547 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    })),
    // 1x B-2 Spirit JDAM — penetration strike
    {
      platformId: 'B2_SPIRIT_JDAM',
      faction: 'BLUE',
      position: { lat: 24.248, lon: 54.547 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    },
    // 1x B-2 Spirit JASSM-ER — standoff strike
    {
      platformId: 'B2_SPIRIT_JASSM',
      faction: 'BLUE',
      position: { lat: 24.248, lon: 54.547 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    },

    // --- RED IADS (south to north approaching Bandar Abbas) ---
    // Surveillance Radar — coastal early warning, 400km range
    {
      platformId: 'SURVEILLANCE_RADAR',
      faction: 'RED',
      position: { lat: 26.7, lon: 56.3 },
      tag: 'obj-surv-radar',
    },
    // Mersad SAM — medium-range covering southern approaches
    {
      platformId: 'MERSAD_SAM',
      faction: 'RED',
      position: { lat: 26.9, lon: 56.2 },
      tag: 'obj-mersad',
    },
    // S-300PMU2 — long-range protecting Bandar Abbas
    {
      platformId: 'S300_PMU2',
      faction: 'RED',
      position: { lat: 27.1, lon: 56.3 },
      tag: 'obj-s300',
    },
    // Tor-M1 — point defense for command post
    {
      platformId: 'TOR_M1',
      faction: 'RED',
      position: { lat: 27.2, lon: 56.3 },
    },
    // Command Post — HVT
    {
      platformId: 'COMMAND_POST',
      faction: 'RED',
      position: { lat: 27.2, lon: 56.35 },
      tag: 'obj-command-post',
    },
  ],

  objectives: [
    { entityTag: 'obj-surv-radar', label: 'Surveillance Radar', type: 'DESTROY' },
    { entityTag: 'obj-s300', label: 'S-300PMU2', type: 'DESTROY' },
    { entityTag: 'obj-mersad', label: 'Mersad SAM', type: 'DESTROY' },
    { entityTag: 'obj-command-post', label: 'Command Post', type: 'DESTROY' },
  ],
  defeatCondition: 'ALL_BLUE_DEAD',

  intel: {
    situation: 'Iranian IADS forces have established a layered air defense network along the coast south of Bandar Abbas. A Ghadir-class surveillance radar provides 400km early warning, backed by S-300PMU2 (150km engagement) and Mersad (50km) SAM batteries in depth, with Tor-M1 point defense protecting the command post. CENTCOM has authorized a precision strike from Al Dhafra Air Base to dismantle the IADS and destroy the command node.',

    mission: 'Destroy the enemy surveillance radar, S-300PMU2 battery, Mersad battery, and command post. Establish air superiority over the Bandar Abbas approaches.',

    threatAssessment: 'HIGH. Layered IADS with 400km early warning, 150km area denial (S-300), 50km medium-range (Mersad), and 12km point defense (Tor-M1). The S-300PMU2 is the primary threat — its 200km tracking radar will detect the non-stealthy Global Hawk at extreme range, but stealth B-2s remain nearly invisible (10-40km detection depending on radar mode). Key insight: Global Hawk sensor range (200km) exceeds S-300 weapon range (150km), creating a 50km safe ISR zone.',

    enemyForces: [
      {
        type: 'Ghadir Surveillance Radar',
        count: '1x confirmed',
        capability: '400km omnidirectional detection. Provides early warning to entire IADS network.',
        notes: 'Coastal position south of Bandar Abbas. Priority SEAD target — blinding this degrades the network.',
      },
      {
        type: 'S-300PMU2 Battery',
        count: '1x confirmed',
        capability: '200km tracking, 150km engagement envelope. Mach 6 missiles. Devastating kill probability.',
        notes: 'Primary area denial threat. Can engage Global Hawk at 200km but B-2 (RCS 0.1) only detectable at ~10-40km.',
      },
      {
        type: 'Mersad SAM Battery',
        count: '1x confirmed',
        capability: '100km tracking, 50km engagement. Iranian Hawk derivative.',
        notes: 'Medium-range layer covering southern approaches.',
      },
      {
        type: 'Tor-M1 SAM',
        count: '1x confirmed',
        capability: '25km detection, 12km engagement. Autonomous 360° radar.',
        notes: 'Point defense for command post. B-2 JDAM can drop from 28km, safely outside 12km envelope.',
      },
      {
        type: 'Command Post',
        count: '1x confirmed',
        capability: 'C2 node coordinating the IADS. Hardened.',
        notes: 'Primary objective. Protected by Tor-M1 point defense.',
      },
    ],

    friendlyForces: [
      { type: 'RQ-4B Global Hawk', count: 2, role: 'ISR — 200km AESA radar for threat detection and targeting' },
      { type: 'B-2 Spirit (JDAM)', count: 1, role: 'Penetration Strike — 28km glide bombs, 16 rounds, must fly into IADS' },
      { type: 'B-2 Spirit (JASSM-ER)', count: 1, role: 'Standoff Strike — 925km cruise missiles, fires from complete safety' },
    ],

    markers: [
      {
        label: 'Surveillance Radar',
        position: { lat: 26.7, lon: 56.3 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'RADAR',
        notes: 'Ghadir-class surveillance radar. 400km omnidirectional detection.',
      },
      {
        label: 'S-300PMU2 Battery',
        position: { lat: 27.1, lon: 56.3 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'S-300PMU2. 200km tracking, 150km engagement. Primary threat.',
      },
      {
        label: 'S-300 Engagement Zone',
        position: { lat: 27.1, lon: 56.3 },
        accuracy: 'ESTIMATED',
        radiusMeters: 150000,
        threatType: 'SAM',
        notes: 'S-300PMU2 engagement envelope. Stay outside unless conducting SEAD.',
      },
      {
        label: 'Mersad SAM Battery',
        position: { lat: 26.9, lon: 56.2 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'Mersad. 100km tracking, 50km engagement.',
      },
      {
        label: 'Tor-M1 SAM',
        position: { lat: 27.2, lon: 56.3 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'Tor-M1 point defense. 25km detection, 12km engagement. B-2 JDAM outranges it.',
      },
      {
        label: 'Command Post',
        position: { lat: 27.2, lon: 56.35 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'COMMAND',
        notes: 'Primary HVT. Protected by Tor-M1.',
      },
    ],

    corridors: [
      {
        name: 'Southern Approach (Direct)',
        waypoints: [
          { lat: 24.248, lon: 54.547 },
          { lat: 25.0, lon: 55.0 },
          { lat: 25.8, lon: 55.8 },
          { lat: 26.5, lon: 56.2 },
        ],
        notes: 'Direct route northeast over the Gulf. ~390km to target area. Global Hawk enters surveillance radar detection at ~200km but remains outside S-300 engagement until 150km. Use this corridor for ISR assets.',
      },
      {
        name: 'Eastern Flanking Route',
        waypoints: [
          { lat: 24.248, lon: 54.547 },
          { lat: 24.8, lon: 55.5 },
          { lat: 25.5, lon: 56.5 },
          { lat: 26.5, lon: 56.8 },
        ],
        notes: 'Swing east to approach from the flank. Avoids direct radar line-of-sight on initial ingress. Longer but provides deception for B-2 penetration.',
      },
    ],

    unconfirmedReports: [
      'SIGINT suggests possible additional mobile Tor-M1 units operating in the Bandar Abbas area. Positions unknown.',
      'Iranian Navy frigate patrol reported 100km south of Bandar Abbas. May provide additional radar coverage.',
    ],
  },

  victoryText: 'All targets destroyed — IADS dismantled',
  defeatText: 'Mission failed — enemy air defenses remain operational',
};
