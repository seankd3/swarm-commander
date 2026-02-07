// --- Draw FURY CCA ---
// Sleek, aggressive CCA fighter silhouette. Fast SEAD hunter.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker, drawSelectionRing } from './draw-common';

export function drawFury(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera, isSelected: boolean): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  if (isSelected) drawSelectionRing(ctx, screen.x, screen.y, 12);

  const headingRad = ((entity.heading - 90) * Math.PI) / 180;
  const color = COLORS.furyBody;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(headingRad);

  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Fuselage — aggressive needle shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(11, 0);
  ctx.lineTo(4, -2);
  ctx.lineTo(-7, -2);
  ctx.lineTo(-9, 0);
  ctx.lineTo(-7, 2);
  ctx.lineTo(4, 2);
  ctx.closePath();
  ctx.fill();

  // Swept wings — cranked arrow
  ctx.beginPath();
  ctx.moveTo(3, -2);
  ctx.lineTo(-2, -10);
  ctx.lineTo(-5, -9);
  ctx.lineTo(-4, -2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(3, 2);
  ctx.lineTo(-2, 10);
  ctx.lineTo(-5, 9);
  ctx.lineTo(-4, 2);
  ctx.closePath();
  ctx.fill();

  // Tail fins — V-tail
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(-10, -5);
  ctx.moveTo(-7, 2);
  ctx.lineTo(-10, 5);
  ctx.stroke();

  // ARM indicator (weapon pylon dots)
  if (entity.ammoState && entity.ammoState.remaining > 0) {
    ctx.fillStyle = '#ff4444';
    const pylons = Math.min(entity.ammoState.remaining, 4);
    for (let i = 0; i < pylons; i++) {
      const x = -1 + i * 2;
      ctx.beginPath();
      ctx.arc(x, i % 2 === 0 ? -5 : 5, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('FURY', screen.x + 14, screen.y + 3);
}
