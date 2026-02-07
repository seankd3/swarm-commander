// --- Approach Variant Registry ---
// 6 approach variants: 2 per mission type (RECON, STRIKE, SEAD).

import type { ApproachVariantDef } from './mission-planner-types';

export const APPROACH_VARIANTS: ApproachVariantDef[] = [

  // ==============================
  // RECON APPROACHES
  // ==============================
  {
    id: 'recon-direct-overfly',
    name: 'Direct Overfly',
    description: 'Fly directly over AO with active radar. Full picture fast but enters SAM envelopes. Best for areas with no known air defenses.',
    tradeoffs: { speed: 5, stealth: 1, fuelCost: 2, risk: 4, complexity: 1, intel: 5 },
    defaultParams: { roe: 'WEAPONS_HOLD', formation: 'LINE', spacing: 2000, speedFraction: 1.0, radarMode: 'ACTIVE' },
    roles: [
      { id: 'scouts', name: 'Scout Element', description: 'Fly search pattern over AO with active radar', requiredCapabilities: ['HAS_SENSOR', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-recon-area',
  },
  {
    id: 'recon-standoff-orbit',
    name: 'Standoff Orbit',
    description: 'Orbit at edge of sensor range, outside long-range SAM envelope. Safe but slower picture build. Global Hawk 200km sensor vs S-300 150km weapon = 50km safe ISR zone.',
    tradeoffs: { speed: 2, stealth: 4, fuelCost: 3, risk: 1, complexity: 1, intel: 3 },
    defaultParams: { roe: 'WEAPONS_HOLD', formation: 'LINE', spacing: 3000, speedFraction: 0.6, radarMode: 'ACTIVE' },
    roles: [
      { id: 'scouts', name: 'Standoff Orbit', description: 'Orbit outside threat rings at 1.5x target radius', requiredCapabilities: ['LONG_RANGE_SENSOR', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-recon-standoff',
  },

  // ==============================
  // STRIKE APPROACHES
  // ==============================
  {
    id: 'strike-jdam-penetrate',
    name: 'JDAM Penetration Strike',
    description: 'B-2 (JDAM) penetrates deep into enemy IADS, drops GPS-guided bombs at 28km. Needs ISR for targeting + SEAD to suppress SAMs first. High risk, high reward.',
    tradeoffs: { speed: 4, stealth: 4, fuelCost: 3, risk: 4, complexity: 3, intel: 3 },
    defaultParams: { roe: 'WEAPONS_FREE', formation: 'COLUMN', spacing: 500, speedFraction: 0.8, radarMode: 'PASSIVE' },
    roles: [
      { id: 'scouts', name: 'ISR Element', description: 'Scout AO to build targeting picture (optional)', requiredCapabilities: ['LONG_RANGE_SENSOR', 'CAN_FLY'], minCount: 0, maxCount: -1, suggestedCount: 1 },
      { id: 'strikers', name: 'Strike Package', description: 'B-2 JDAM penetrates to bomb targets', requiredCapabilities: ['HAS_CRUISE_MISSILE', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-strike-penetrate',
  },
  {
    id: 'strike-jassm-standoff',
    name: 'JASSM-ER Standoff Strike',
    description: 'B-2 (JASSM-ER) fires cruise missiles from 500km+ standoff, outside all threat rings. Low risk but expensive. 925km missile range covers the entire AO.',
    tradeoffs: { speed: 2, stealth: 5, fuelCost: 2, risk: 1, complexity: 2, intel: 3 },
    defaultParams: { roe: 'WEAPONS_FREE', formation: 'LINE', spacing: 5000, speedFraction: 0.6, radarMode: 'PASSIVE' },
    roles: [
      { id: 'scouts', name: 'ISR Element', description: 'Scout AO to locate targets (optional)', requiredCapabilities: ['LONG_RANGE_SENSOR', 'CAN_FLY'], minCount: 0, maxCount: -1, suggestedCount: 1 },
      { id: 'bombers', name: 'Standoff Bombers', description: 'Fire JASSM-ER from maximum standoff range', requiredCapabilities: ['HAS_CRUISE_MISSILE', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-strike-standoff',
  },

  // ==============================
  // SEAD APPROACHES
  // ==============================
  {
    id: 'sead-standoff',
    name: 'Standoff SEAD',
    description: 'ISR locates air defenses, B-2 (JASSM-ER) destroys them from 500km+ standoff. Safe and systematic but uses expensive long-range missiles.',
    tradeoffs: { speed: 2, stealth: 5, fuelCost: 3, risk: 1, complexity: 3, intel: 5 },
    defaultParams: { roe: 'WEAPONS_FREE', formation: 'LINE', spacing: 5000, speedFraction: 0.6, radarMode: 'PASSIVE' },
    roles: [
      { id: 'scouts', name: 'ISR Designators', description: 'Locate and classify air defense targets from standoff', requiredCapabilities: ['LONG_RANGE_SENSOR', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
      { id: 'bombers', name: 'Standoff Bombers', description: 'Fire JASSM-ER at confirmed SAM/radar positions', requiredCapabilities: ['HAS_CRUISE_MISSILE', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-sead-standoff',
  },
  {
    id: 'sead-penetrate',
    name: 'Penetration SEAD',
    description: 'ISR locates defenses, B-2 (JDAM) penetrates IADS layers to bomb them. Risky but uses cheaper JDAMs. Best after long-range SAMs are suppressed.',
    tradeoffs: { speed: 4, stealth: 3, fuelCost: 3, risk: 4, complexity: 3, intel: 4 },
    defaultParams: { roe: 'WEAPONS_FREE', formation: 'COLUMN', spacing: 2000, speedFraction: 0.8, radarMode: 'PASSIVE' },
    roles: [
      { id: 'scouts', name: 'ISR Element', description: 'Locate and classify air defense targets', requiredCapabilities: ['LONG_RANGE_SENSOR', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
      { id: 'strikers', name: 'JDAM Strikers', description: 'Penetrate to bomb SAM/radar sites', requiredCapabilities: ['HAS_CRUISE_MISSILE', 'CAN_FLY'], minCount: 1, maxCount: -1, suggestedCount: 1 },
    ],
    taskGeneratorId: 'gen-sead-penetrate',
  },
];

export function getApproachVariant(id: string): ApproachVariantDef | undefined {
  return APPROACH_VARIANTS.find(a => a.id === id);
}
