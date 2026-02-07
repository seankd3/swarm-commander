// --- Canvas Renderer ---
// Thin orchestrator: clears screen, calls layers in order.

import type { GameState } from '../simulation/types';
import type { Camera } from './camera';
// Layers
import { drawGrid, drawPlayArea } from './layers/terrain-layer';
import { drawSensorCoverages, drawThreatRings } from './layers/sensor-layer';
import { drawEntities } from './layers/entity-layer';
import { drawContacts } from './layers/contact-layer';
import { drawMissiles } from './layers/missile-layer';
import {
  drawSelectionBox,
  drawRWRWarnings,
  drawTaskAreas,
  drawPlacementPreview,
  drawMissionResult,
} from './layers/ui-layer';
import { drawAOCircle, drawIngressVector, drawEgressVector } from './layers/planner-layer';
import { drawIntelMarkers } from './layers/intel-layer';
import { drawRunways } from './layers/runway-layer';
import type { Position } from '../simulation/types';
import type { IntelMarker } from '../scenarios/scenario-types';

/** Options passed from main.ts for interactive overlays */
export interface RenderOptions {
  taskPlacementMode?: boolean;
  selectedAreaRadius?: number;
  mouseScreenPos?: { x: number; y: number } | null;
  selectedTaskType?: string | null;
  // Planner overlay data
  plannerTarget?: Position | null;
  plannerRadius?: number;
  plannerIngress?: Position | null;
  plannerEgress?: Position | null;
  // Intel markers from briefing
  intelMarkers?: IntelMarker[];
}

/** Main rendering function */
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  options?: RenderOptions,
): void {
  const { viewportWidth: w, viewportHeight: h } = camera;

  // Clear — transparent so MapLibre tiles show through
  ctx.clearRect(0, 0, w, h);

  // 1. Grid + play area overlay (terrain provided by MapLibre)
  drawGrid(ctx, camera);
  drawPlayArea(ctx, state, camera);

  // 2. Task areas
  drawTaskAreas(ctx, state, camera);

  // 3. Placement preview
  if (options?.taskPlacementMode && options.mouseScreenPos) {
    drawPlacementPreview(ctx, camera, options);
  }

  // 3b. Intel markers from briefing (underneath threat rings / entities)
  if (options?.intelMarkers && options.intelMarkers.length > 0) {
    drawIntelMarkers(ctx, camera, options.intelMarkers);
  }

  // 4. Threat rings
  drawThreatRings(ctx, state, camera);

  // 5. Sensor coverages
  drawSensorCoverages(ctx, state, camera);

  // 5b. Runway overlays
  drawRunways(ctx, state, camera);

  // 6. Selection box
  drawSelectionBox(ctx, state);

  // 7. Contacts
  drawContacts(ctx, state, camera);

  // 8. Entities
  drawEntities(ctx, state, camera);

  // 9. RWR warnings
  drawRWRWarnings(ctx, state, camera);

  // 10. Missiles
  drawMissiles(ctx, state, camera);

  // 11. Planner overlay (AO circle, ingress/egress vector arrows)
  if (options?.plannerTarget) {
    drawAOCircle(ctx, camera, options.plannerTarget, options.plannerRadius ?? 5000);
    if (options.plannerIngress) {
      drawIngressVector(ctx, camera, options.plannerIngress, options.plannerTarget);
    }
    if (options.plannerEgress) {
      drawEgressVector(ctx, camera, options.plannerEgress, options.plannerTarget);
    }
  }

  // 12. Mission result overlay
  drawMissionResult(ctx, state, w, h);
}
