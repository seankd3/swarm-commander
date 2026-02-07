// --- Draw Command Post ---
// Enemy C2 bunker with antenna mast.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker } from './draw-common';

export function drawCommandPost(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  const color = COLORS.redUnit;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Bunker body (reinforced rectangle)
  ctx.fillStyle = COLORS.redUnitDark;
  ctx.fillRect(-7, -5, 14, 10);

  // Bunker outline
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-7, -5, 14, 10);

  // Cross-hatch pattern (reinforced)
  ctx.strokeStyle = 'rgba(231, 106, 110, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-7, -5);
  ctx.lineTo(7, 5);
  ctx.moveTo(7, -5);
  ctx.lineTo(-7, 5);
  ctx.stroke();

  // Antenna mast
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, -14);
  ctx.stroke();

  // Antenna cross-bar
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-4, -12);
  ctx.lineTo(4, -12);
  ctx.stroke();

  // Antenna tip
  ctx.fillStyle = '#ff6666';
  ctx.beginPath();
  ctx.arc(0, -14, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('CP', screen.x + 12, screen.y + 3);
}
