// --- Platform Registry ---
// Single source of truth for all platform definitions.
// Systems call getPlatform(id) to read static data.

import type { PlatformDef } from './platform-types';

const REGISTRY = new Map<string, PlatformDef>();

/** Register a platform definition */
export function registerPlatform(def: PlatformDef): void {
  if (REGISTRY.has(def.id)) {
    throw new Error(`Platform already registered: ${def.id}`);
  }
  REGISTRY.set(def.id, def);
}

/** Get a platform definition by ID (throws if not found) */
export function getPlatform(id: string): PlatformDef {
  const def = REGISTRY.get(id);
  if (!def) {
    throw new Error(`Unknown platform: ${id}`);
  }
  return def;
}

/** Get all registered platform IDs */
export function getAllPlatformIds(): string[] {
  return Array.from(REGISTRY.keys());
}

/** Register an array of platform definitions */
export function registerPlatforms(defs: PlatformDef[]): void {
  for (const def of defs) {
    registerPlatform(def);
  }
}
