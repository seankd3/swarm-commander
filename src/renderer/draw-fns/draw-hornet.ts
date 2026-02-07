// --- Draw HORNET ---
// Compact swept-wing attack drone silhouette.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker, drawSelectionRing } from './draw-common';

export function drawHornet(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera, isSelected: boolean): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  if (isSelected) drawSelectionRing(ctx, screen.x, screen.y, 12);

  const headingRad = ((entity.heading - 90) * Math.PI) / 180;
  const color = COLORS.hornetBody;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(headingRad);

  ctx.shadowColor = color;
  ctx.shadowBlur = 6;

  // Fuselage
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(3, -1.5);
  ctx.lineTo(-6, -1.5);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-6, 1.5);
  ctx.lineTo(3, 1.5);
  ctx.closePath();
  ctx.fill();

  // Delta wings
  ctx.beginPath();
  ctx.moveTo(4, -1.5);
  ctx.lineTo(-4, -9);
  ctx.lineTo(-6, -8);
  ctx.lineTo(-5, -1.5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(4, 1.5);
  ctx.lineTo(-4, 9);
  ctx.lineTo(-6, 8);
  ctx.lineTo(-5, 1.5);
  ctx.closePath();
  ctx.fill();

  // Tail fins
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(-6, -1.5);
  ctx.lineTo(-8, -4);
  ctx.moveTo(-6, 1.5);
  ctx.lineTo(-8, 4);
  ctx.stroke();

  // Warhead indicator
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(8, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('HRNT', screen.x + 12, screen.y + 3);
}
