// --- Render Utilities ---
// Shared helpers used by multiple render layers.

import type { Camera } from './camera';

/** Convert meters to screen pixels at current zoom */
export function metersToPixels(camera: Camera, meters: number): number {
  const degreesPerMeter = 1 / 111000;
  return meters * degreesPerMeter * camera.zoom;
}
