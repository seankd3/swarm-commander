// --- Scenario Registry ---
// Single source of truth for all available missions.

import type { ScenarioDef } from './scenario-types';

const REGISTRY = new Map<string, ScenarioDef>();

export function registerScenario(def: ScenarioDef): void {
  if (REGISTRY.has(def.id)) {
    throw new Error(`Scenario already registered: ${def.id}`);
  }
  REGISTRY.set(def.id, def);
}

export function getScenario(id: string): ScenarioDef {
  const def = REGISTRY.get(id);
  if (!def) throw new Error(`Unknown scenario: ${id}`);
  return def;
}

export function getAllScenarios(): ScenarioDef[] {
  return Array.from(REGISTRY.values());
}
