// --- Entity Factory ---
// Creates runtime Entity instances from PlatformDef data.
// One generic function replaces per-type factory functions.

import type { Entity, EntityId, Position, Faction } from './types';
import { getPlatform } from '../platforms/platform-registry';

let entityCounter = 0;

/** Reset counter (for testing) */
export function resetEntityCounter(): void {
  entityCounter = 0;
}

/** Create a runtime entity from a platform definition */
export function createEntity(
  platformId: string,
  faction: Faction,
  position: Position,
  opts?: {
    heading?: number;
    id?: EntityId;
  },
): Entity {
  const def = getPlatform(platformId);
  const id = opts?.id ?? `${def.label.toLowerCase()}-${++entityCounter}`;

  return {
    id,
    platformId,
    type: def.id,       // backward compat: systems still read entity.type
    faction,
    position: { ...position },
    velocity: { heading: opts?.heading ?? 0, speed: 0 },
    heading: opts?.heading ?? 0,
    state: 'IDLE',
    health: def.health,
    maxHealth: def.health,
    maxSpeed: def.movement?.maxSpeed ?? 0,
    destination: null,
    target: null,
    sensor: def.sensor
      ? {
          type: def.sensor.type,
          range: def.sensor.range,
          fieldOfView: def.sensor.fieldOfView,
          currentAngle: 0,
          rotationSpeed: def.sensor.rotationSpeed,
        }
      : null,
    isDetected: false,
    detectedBy: [],
    taskQueue: [],
    currentTaskId: null,
    lastFireTime: -Infinity,
    radarMode: 'ACTIVE',
    rcs: def.radarCrossSection ?? 1.0,

    // Flight ops
    flightState: def.category === 'AIR' ? 'AIRBORNE' : 'GROUNDED',
    homeBaseId: null,
    fuelState: def.fuel
      ? { remaining: def.fuel.capacity, capacity: def.fuel.capacity, isBingo: false }
      : null,
    baseState: def.base
      ? { parkedAircraft: [], launchQueue: [], lastLaunchTime: -Infinity, lastRecoveryTime: -Infinity }
      : null,
    tag: null,

    // Weapon state
    ammoState: def.weapon && def.weapon.ammoCapacity > 0
      ? { remaining: def.weapon.ammoCapacity, capacity: def.weapon.ammoCapacity }
      : null,
    orbitRadius: null,
  };
}
