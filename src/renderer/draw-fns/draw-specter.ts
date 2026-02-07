// --- Draw SPECTER ---
// Long-wing ISR drone silhouette (Predator/Reaper style).

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker, drawSelectionRing } from './draw-common';

export function drawSpecter(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera, isSelected: boolean): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  if (isSelected) drawSelectionRing(ctx, screen.x, screen.y, 14);

  const headingRad = ((entity.heading - 90) * Math.PI) / 180;
  const color = COLORS.blueUnit;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(headingRad);

  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Fuselage
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(3, -1.2);
  ctx.lineTo(-8, -1.2);
  ctx.lineTo(-10, 0);
  ctx.lineTo(-8, 1.2);
  ctx.lineTo(3, 1.2);
  ctx.closePath();
  ctx.fill();

  // Main wings
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-1, -12);
  ctx.lineTo(2, -2);
  ctx.moveTo(-1, 12);
  ctx.lineTo(2, 2);
  ctx.stroke();

  // Wing fill
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-1, -12);
  ctx.lineTo(2, -1.2);
  ctx.lineTo(-3, -1.2);
  ctx.lineTo(-2, -11);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-1, 12);
  ctx.lineTo(2, 1.2);
  ctx.lineTo(-3, 1.2);
  ctx.lineTo(-2, 11);
  ctx.closePath();
  ctx.fill();

  // V-tail
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(-12, -4);
  ctx.moveTo(-10, 0);
  ctx.lineTo(-12, 4);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('SPEC', screen.x + 14, screen.y + 3);
}
