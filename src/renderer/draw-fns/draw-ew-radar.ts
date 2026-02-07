// --- Draw EW Radar ---
// Early warning radar dome — large omnidirectional detection.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker } from './draw-common';

export function drawEwRadar(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  const color = COLORS.redUnit;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Base platform
  ctx.fillStyle = COLORS.redUnitDark;
  ctx.fillRect(-8, 2, 16, 4);

  // Dome (large arc)
  ctx.fillStyle = 'rgba(231, 106, 110, 0.15)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 2, 10, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Inner dome detail
  ctx.strokeStyle = 'rgba(231, 106, 110, 0.4)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, 2, 6, Math.PI, 0);
  ctx.stroke();

  // Pulsing ring indicator (uses game time via entity heading hack — just static for now)
  ctx.strokeStyle = 'rgba(231, 106, 110, 0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('EWR', screen.x + 14, screen.y + 3);
}
