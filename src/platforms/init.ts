// --- Platform Initialization ---
// Call once at startup to register all platform definitions.

import { registerPlatforms } from './platform-registry';
import { BLUE_AIR_PLATFORMS } from './defs/blue-air';
import { BLUE_BASE_PLATFORMS } from './defs/blue-bases';
import { RED_GROUND_PLATFORMS } from './defs/red-ground';

let initialized = false;

export function initPlatforms(): void {
  if (initialized) return;
  registerPlatforms(BLUE_AIR_PLATFORMS);
  registerPlatforms(BLUE_BASE_PLATFORMS);
  registerPlatforms(RED_GROUND_PLATFORMS);
  initialized = true;
}
