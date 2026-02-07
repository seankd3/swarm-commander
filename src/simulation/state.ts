// --- State Factory ---
// Creates initial GameState from a ScenarioDef.

import type { GameState, EntityId, Entity } from './types';
import { createEntity } from './entity-factory';
import { initPlatforms } from '../platforms/init';
import { initScenarios } from '../scenarios/init';
import { getScenario } from '../scenarios/scenario-registry';

/** Create game state from a scenario definition */
export function createInitialState(scenarioId: string): GameState {
  initPlatforms();
  initScenarios();

  const scenario = getScenario(scenarioId);
  const entities = new Map<EntityId, Entity>();

  // First pass: create all entities
  for (const spawn of scenario.entities) {
    const entity = createEntity(spawn.platformId, spawn.faction, spawn.position, {
      heading: spawn.heading,
      id: spawn.id,
    });

    // Apply overrides
    let e = entity;
    if (spawn.tag) e = { ...e, tag: spawn.tag };
    if (spawn.flightState) e = { ...e, flightState: spawn.flightState };
    if (spawn.homeBaseId) e = { ...e, homeBaseId: spawn.homeBaseId };

    entities.set(e.id, e);
  }

  // Second pass: build base parked-aircraft lists
  for (const [, entity] of entities) {
    if (entity.flightState === 'PARKED' && entity.homeBaseId) {
      const base = entities.get(entity.homeBaseId);
      if (base?.baseState) {
        entities.set(base.id, {
          ...base,
          baseState: {
            ...base.baseState,
            parkedAircraft: [...base.baseState.parkedAircraft, entity.id],
          },
        });
      }
    }
  }

  return {
    time: {
      elapsed: 0,
      missionDuration: scenario.duration,
      speed: 0,
      previousSpeed: 1,
    },
    entities,
    contacts: new Map(),
    missiles: [],
    tasks: [],
    selection: {
      selectedIds: new Set(),
      boxStart: null,
      boxEnd: null,
    },
    missionResult: 'PENDING',
    notifications: [],
    events: [],
    objectives: scenario.objectives,
    defeatCondition: scenario.defeatCondition,
    victoryText: scenario.victoryText,
    defeatText: scenario.defeatText,
    playArea: scenario.maxBounds ?? null,
  };
}
