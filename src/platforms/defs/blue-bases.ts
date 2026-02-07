// --- Blue Base Platforms ---
// Airbases and forward arming/refueling points

import type { PlatformDef } from '../platform-types';

export const AIRBASE: PlatformDef = {
  id: 'AIRBASE',
  name: 'Outpost Base',
  label: 'BASE',
  category: 'GROUND',
  description: 'Forward operating base with aircraft launch and recovery capability',
  health: 500,

  // No movement — fixed site
  // No sensor — relies on aircraft for ISR
  // No weapon — unarmed
  base: {
    capacity: 12,              // max parked aircraft
    launchInterval: 15,        // seconds between launches
    recoveryInterval: 20,      // seconds between recoveries
    baseType: 'AIRBASE',
  },

  render: {
    drawFn: 'base',
    color: '#4C90F0',
    glowColor: 'rgba(76, 144, 240, 0.3)',
    size: 14,
  },
};

export const BLUE_BASE_PLATFORMS: PlatformDef[] = [AIRBASE];
