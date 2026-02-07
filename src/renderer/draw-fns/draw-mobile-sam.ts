// --- Draw Mobile SAM ---
// SA-8 style wheeled vehicle with short-range launcher.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker } from './draw-common';

export function drawMobileSam(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
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

  // Vehicle body (rounded)
  ctx.fillStyle = COLORS.redUnitDark;
  ctx.beginPath();
  ctx.moveTo(-6, -3);
  ctx.lineTo(6, -3);
  ctx.lineTo(7, 0);
  ctx.lineTo(6, 3);
  ctx.lineTo(-6, 3);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();

  // Wheels (6-wheel)
  ctx.fillStyle = '#3a1515';
  for (const xOff of [-5, 0, 5]) {
    ctx.fillRect(xOff - 1.5, -4.5, 3, 1.5);
    ctx.fillRect(xOff - 1.5, 3, 3, 1.5);
  }

  // Short launcher tubes (2, angled up)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.lineTo(-4, -8);
  ctx.moveTo(2, 0);
  ctx.lineTo(0, -8);
  ctx.stroke();

  // Missile tips
  ctx.fillStyle = '#ff6666';
  ctx.beginPath();
  ctx.arc(-4, -8, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -8, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('MSAM', screen.x + 12, screen.y + 3);
}
