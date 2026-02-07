// --- Runway Layer ---
// Draws runway overlay lines on the map, aligned to real-world runway geometry.

import type { GameState } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { getPlatform } from '../../platforms/platform-registry';
import { getRunwaysForBase } from '../../data/airbase-runways';
import { isRunwayOccupied } from '../../simulation/systems/runway-ops';

export function drawRunways(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const entity of state.entities.values()) {
    if (!entity.baseState) continue;
    if (entity.state === 'DESTROYED') continue;

    const plat = getPlatform(entity.platformId);
    if (!plat.base) continue;

    const runways = getRunwaysForBase(entity.id);
    if (!runways) continue;

    const active = isRunwayOccupied(entity.id);

    for (const runway of runways) {
      const screenA = worldToScreen(camera, runway.thresholdA);
      const screenB = worldToScreen(camera, runway.thresholdB);

      // Runway centerline
      ctx.save();
      if (active) {
        ctx.strokeStyle = 'rgba(76, 144, 240, 0.6)';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(76, 144, 240, 0.4)';
        ctx.shadowBlur = 6;
      } else {
        ctx.strokeStyle = 'rgba(76, 144, 240, 0.2)';
        ctx.lineWidth = 1;
      }
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(screenA.x, screenA.y);
      ctx.lineTo(screenB.x, screenB.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Threshold ticks (perpendicular marks at each end)
      const dx = screenB.x - screenA.x;
      const dy = screenB.y - screenA.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        // Perpendicular unit vector
        const px = -dy / len;
        const py = dx / len;
        const tickLen = 6;

        ctx.strokeStyle = active ? 'rgba(76, 144, 240, 0.5)' : 'rgba(76, 144, 240, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 0;

        // Threshold A tick
        ctx.beginPath();
        ctx.moveTo(screenA.x - px * tickLen, screenA.y - py * tickLen);
        ctx.lineTo(screenA.x + px * tickLen, screenA.y + py * tickLen);
        ctx.stroke();

        // Threshold B tick
        ctx.beginPath();
        ctx.moveTo(screenB.x - px * tickLen, screenB.y - py * tickLen);
        ctx.lineTo(screenB.x + px * tickLen, screenB.y + py * tickLen);
        ctx.stroke();
      }

      ctx.restore();
    }
  }
}
