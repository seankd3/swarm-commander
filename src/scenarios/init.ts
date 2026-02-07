// --- Scenario Initialization ---
// Register all available scenarios.

import { registerScenario } from './scenario-registry';
import { OPENING_STRIKE } from './opening-strike';
import { ARCHIPELAGO_SWEEP } from './archipelago-sweep';

let initialized = false;

export function initScenarios(): void {
  if (initialized) return;
  registerScenario(OPENING_STRIKE);
  registerScenario(ARCHIPELAGO_SWEEP);
  initialized = true;
}
