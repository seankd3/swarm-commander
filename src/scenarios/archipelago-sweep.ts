// --- Archipelago Sweep ---
// Full campaign: South China Sea — SEAD + strike across the Paracel Islands.

import type { ScenarioDef } from './scenario-types';

export const ARCHIPELAGO_SWEEP: ScenarioDef = {
  id: 'archipelago-sweep',
  name: 'Archipelago Sweep',
  description: 'Intelligence reports a RED integrated air defense network spanning the Paracel Islands. Multiple radar sites, SAM batteries, and a command post are distributed across the archipelago. Systematically suppress enemy air defenses and destroy the command post to achieve air superiority. Manage fuel carefully — you cannot launch everything at once.',
  duration: Infinity, // no time limit

  // Paracel Islands, South China Sea
  mapCenter: { lat: 16.5, lon: 112.3 },
  mapZoom: 9,
  maxBounds: {
    north: 17.2,
    south: 15.6,
    east: 113.2,
    west: 111.2,
  },

  entities: [
    // ========== BLUE ==========

    // Forward Operating Base — southern approach
    {
      platformId: 'AIRBASE',
      faction: 'BLUE',
      position: { lat: 15.85, lon: 111.60 },
      id: 'outpost-base',
    },

    // 4x RQ-4B Global Hawk — ISR/target designation
    ...Array.from({ length: 4 }, () => ({
      platformId: 'RQ4_GLOBAL_HAWK',
      faction: 'BLUE' as const,
      position: { lat: 15.85, lon: 111.60 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    })),

    // 2x B-2 Spirit JASSM-ER — standoff SEAD
    ...Array.from({ length: 2 }, () => ({
      platformId: 'B2_SPIRIT_JASSM',
      faction: 'BLUE' as const,
      position: { lat: 15.85, lon: 111.60 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    })),

    // 2x B-2 Spirit JDAM — penetration strikes
    ...Array.from({ length: 2 }, () => ({
      platformId: 'B2_SPIRIT_JDAM',
      faction: 'BLUE' as const,
      position: { lat: 15.85, lon: 111.60 },
      heading: 0,
      homeBaseId: 'outpost-base',
      flightState: 'PARKED' as const,
    })),

    // ========== RED ==========

    // Surveillance Radar — Woody Island (main island)
    {
      platformId: 'SURVEILLANCE_RADAR',
      faction: 'RED',
      position: { lat: 16.84, lon: 112.34 },
      tag: 'obj-surv-radar',
    },

    // S-300PMU2 — Woody Island (main defense)
    {
      platformId: 'S300_PMU2',
      faction: 'RED',
      position: { lat: 16.83, lon: 112.33 },
      tag: 'obj-s300-alpha',
    },

    // Mersad SAM — Rocky Island (northern defense)
    {
      platformId: 'MERSAD_SAM',
      faction: 'RED',
      position: { lat: 16.92, lon: 112.33 },
      tag: 'obj-mersad-bravo',
    },

    // Mersad SAM — Duncan Islands (southeastern defense)
    {
      platformId: 'MERSAD_SAM',
      faction: 'RED',
      position: { lat: 16.45, lon: 112.73 },
      tag: 'obj-mersad-charlie',
    },

    // Tor-M1 — Lincoln Island (point defense)
    {
      platformId: 'TOR_M1',
      faction: 'RED',
      position: { lat: 16.67, lon: 112.73 },
    },

    // Tor-M1 — Triton Island (southern picket)
    {
      platformId: 'TOR_M1',
      faction: 'RED',
      position: { lat: 15.78, lon: 111.21 },
    },

    // Command Post — Woody Island center (primary HVT)
    {
      platformId: 'COMMAND_POST',
      faction: 'RED',
      position: { lat: 16.835, lon: 112.345 },
      tag: 'obj-command-post',
    },
  ],

  objectives: [
    { entityTag: 'obj-surv-radar', label: 'Surveillance Radar', type: 'DESTROY' },
    { entityTag: 'obj-s300-alpha', label: 'S-300PMU2', type: 'DESTROY' },
    { entityTag: 'obj-mersad-bravo', label: 'Mersad SAM (Rocky)', type: 'DESTROY' },
    { entityTag: 'obj-mersad-charlie', label: 'Mersad SAM (Duncan)', type: 'DESTROY' },
    { entityTag: 'obj-command-post', label: 'COMMAND POST', type: 'DESTROY' },
  ],
  defeatCondition: 'ALL_BLUE_DEAD',

  intel: {
    situation: 'PLA forces have established an integrated air defense network (IADS) across the Paracel Islands in the South China Sea. The network consists of a Ghadir-class surveillance radar on Woody Island providing 400km early warning, an S-300PMU2 battery for area denial, Mersad SAMs for medium-range coverage, and Tor-M1 point defense units on outlying islands. A central command post coordinates the entire network. This IADS denies air access across a 300km zone.',

    mission: 'Conduct a deliberate SEAD campaign to dismantle the enemy IADS, then destroy the command post on Woody Island. Priority: blind the surveillance radar, suppress the S-300 and Mersad batteries to open strike corridors, then deliver precision strikes on the command post. Manage fuel and munitions carefully — this is a multi-phase operation.',

    threatAssessment: 'HIGH. Layered IADS with 400km early warning, S-300PMU2 area denial (150km engagement), Mersad medium-range coverage (50km), and Tor-M1 point defense (12km). The S-300 on Woody Island creates a massive engagement zone. Tor-M1 units on the flanks provide autonomous point defense. The surveillance radar detects aircraft at extreme range — expect to be tracked well before entering weapon range. B-2 stealth (RCS 0.1) significantly reduces detection ranges.',

    enemyForces: [
      {
        type: 'Surveillance Radar (Woody Island)',
        count: '1x confirmed',
        capability: '400km omnidirectional detection. Provides cueing data to entire IADS network.',
        notes: 'Priority SEAD target — blinding this radar degrades the entire network',
      },
      {
        type: 'S-300PMU2 Battery (Woody Island)',
        count: '1x confirmed',
        capability: '200km tracking, 150km engagement. Mach 6 missiles.',
        notes: 'Primary area denial threat. Co-located with surveillance radar for mutual protection.',
      },
      {
        type: 'Mersad SAM Battery',
        count: '2x confirmed (Rocky Island N, Duncan Islands SE)',
        capability: '100km tracking, 50km engagement. Sayyad-2 missiles.',
        notes: 'Medium-range layer. Cover northern and southeastern approaches.',
      },
      {
        type: 'Tor-M1 SAM',
        count: '2x confirmed (Lincoln Island, Triton Island)',
        capability: '25km detection, 12km engagement. Autonomous 360° radar.',
        notes: 'Point defense on outlying islands. B-2 JDAM outranges them at 28km.',
      },
      {
        type: 'Command Post (Woody Island)',
        count: '1x confirmed',
        capability: 'C2 node coordinating IADS. Hardened bunker, requires direct hit to destroy.',
        notes: 'Primary objective. Destroying this decapitates the defense network.',
      },
    ],

    friendlyForces: [
      { type: 'RQ-4B Global Hawk', count: 4, role: 'ISR — 200km AESA radar for threat detection and targeting' },
      { type: 'B-2 Spirit (JASSM-ER)', count: 2, role: 'Standoff SEAD — 925km cruise missiles from outside all threat rings' },
      { type: 'B-2 Spirit (JDAM)', count: 2, role: 'Penetration Strike — 28km glide bombs for targets after SEAD clears the corridor' },
    ],

    markers: [
      // --- CONFIRMED positions ---
      {
        label: 'Surveillance Radar — Woody Island',
        position: { lat: 16.84, lon: 112.34 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'EW',
        notes: 'Ghadir-class 400km surveillance radar. Active emissions confirmed by ELINT.',
      },
      {
        label: 'S-300PMU2 — Woody Island',
        position: { lat: 16.83, lon: 112.33 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'S-300PMU2. 200km tracking, 150km engagement.',
      },
      {
        label: 'Mersad SAM — Rocky Island',
        position: { lat: 16.92, lon: 112.33 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'Mersad battery. 100km tracking, 50km engagement.',
      },
      {
        label: 'Mersad SAM — Duncan Islands',
        position: { lat: 16.45, lon: 112.73 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'SAM',
        notes: 'Mersad battery. Southeastern coverage.',
      },
      {
        label: 'Command Post — Woody Island',
        position: { lat: 16.835, lon: 112.345 },
        accuracy: 'CONFIRMED',
        radiusMeters: 0,
        threatType: 'COMMAND',
        notes: 'Primary HVT. Hardened C2 bunker.',
      },

      // --- ESTIMATED positions (mobile units) ---
      {
        label: 'Tor-M1 — Lincoln Island (est.)',
        position: { lat: 16.67, lon: 112.73 },
        accuracy: 'ESTIMATED',
        radiusMeters: 3000,
        threatType: 'SAM',
        notes: 'Tor-M1 point defense. Position based on 24hr-old satellite imagery.',
      },
      {
        label: 'Tor-M1 — Triton Island (est.)',
        position: { lat: 15.78, lon: 111.21 },
        accuracy: 'ESTIMATED',
        radiusMeters: 3000,
        threatType: 'SAM',
        notes: 'Tor-M1 southern picket. Caution: within range of FOB departure routes.',
      },

      // --- Engagement zones ---
      {
        label: 'S-300 Engagement Zone',
        position: { lat: 16.83, lon: 112.33 },
        accuracy: 'ESTIMATED',
        radiusMeters: 150000,
        threatType: 'SAM',
        notes: 'S-300PMU2 engagement envelope around Woody Island. High threat.',
      },
    ],

    corridors: [
      {
        name: 'Southern Approach (Primary)',
        waypoints: [
          { lat: 15.85, lon: 111.60 },
          { lat: 16.10, lon: 111.80 },
          { lat: 16.35, lon: 112.10 },
          { lat: 16.60, lon: 112.30 },
        ],
        notes: 'Direct approach from FOB. Global Hawk enters surveillance radar detection at ~400km but S-300 can only engage at 150km. ISR assets should establish contact picture from standoff.',
      },
      {
        name: 'Eastern Sweep',
        waypoints: [
          { lat: 15.85, lon: 111.60 },
          { lat: 16.00, lon: 112.40 },
          { lat: 16.30, lon: 112.70 },
          { lat: 16.60, lon: 112.50 },
        ],
        notes: 'Swing east to target Duncan Islands Mersad and Lincoln Island Tor-M1 first. Opens eastern corridor for follow-up strikes.',
      },
      {
        name: 'Western End-Run',
        waypoints: [
          { lat: 15.85, lon: 111.60 },
          { lat: 16.20, lon: 111.40 },
          { lat: 16.60, lon: 111.80 },
          { lat: 16.80, lon: 112.10 },
        ],
        notes: 'Approach from the west, avoiding the Triton Island Tor-M1. Arrives from unexpected angle but longer route.',
      },
    ],

    unconfirmedReports: [
      'SIGINT intercepts indicate possible enemy fighter sorties from Hainan Island, ~300km north. ETA unknown.',
      'Satellite thermal imaging shows possible vehicle movements on Woody Island in the last 12 hours.',
      'Maritime patrol reports PLA Navy frigate operating 80km northeast. May provide additional radar coverage.',
    ],
  },

  victoryText: 'Air superiority achieved — all targets destroyed',
  defeatText: 'Mission failed — enemy air defenses remain operational',
};
