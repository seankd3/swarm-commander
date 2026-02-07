// --- Mission Type Registry ---
// Data definitions for all available mission types.
// Requirements use capability queries, not hardcoded platform IDs.

import type { MissionTypeDef } from './mission-planner-types';

export const MISSION_TYPES: MissionTypeDef[] = [
  {
    id: 'RECON',
    name: 'Reconnaissance',
    shortName: 'RECON',
    description: 'Scout an area to build the contact picture. No engagement expected.',
    category: 'offensive',
    requirements: [
      { any: ['HAS_SENSOR', 'CAN_FLY'] },
    ],
    approachIds: ['recon-direct-overfly', 'recon-standoff-orbit'],
  },
  {
    id: 'STRIKE',
    name: 'Direct Strike',
    shortName: 'STRIKE',
    description: 'Attack a known target or area with lethal force.',
    category: 'offensive',
    requirements: [
      { any: ['HAS_WEAPON', 'CAN_FLY'] },
    ],
    approachIds: ['strike-jdam-penetrate', 'strike-jassm-standoff'],
  },
  {
    id: 'SEAD',
    name: 'Suppress Enemy Air Defenses',
    shortName: 'SEAD',
    description: 'Locate and destroy enemy radar and SAM systems. Requires scouts AND strikers.',
    category: 'offensive',
    requirements: [
      { any: ['LONG_RANGE_SENSOR', 'CAN_FLY'] },
      { any: ['HAS_WEAPON', 'CAN_FLY'] },
    ],
    approachIds: ['sead-standoff', 'sead-penetrate'],
  },
];

export function getMissionType(id: string): MissionTypeDef | undefined {
  return MISSION_TYPES.find(m => m.id === id);
}
