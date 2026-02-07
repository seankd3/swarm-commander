// --- Draw STEALTH BOMBER ---
// Flying wing silhouette inspired by B-2/B-21. Large, low-observable.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker, drawSelectionRing } from './draw-common';

export function drawStealthBomber(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera, isSelected: boolean): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  if (isSelected) drawSelectionRing(ctx, screen.x, screen.y, 16);

  const headingRad = ((entity.heading - 90) * Math.PI) / 180;
  const color = COLORS.bomberBody;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(headingRad);

  ctx.shadowColor = color;
  ctx.shadowBlur = 10;

  // Flying wing — broad chevron shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(10, 0);        // nose
  ctx.lineTo(3, -3);        // forward edge
  ctx.lineTo(-6, -14);      // wingtip left
  ctx.lineTo(-8, -13);      // trailing edge left
  ctx.lineTo(-4, -3);       // inner trailing left
  ctx.lineTo(-6, 0);        // center trailing
  ctx.lineTo(-4, 3);        // inner trailing right
  ctx.lineTo(-8, 13);       // trailing edge right
  ctx.lineTo(-6, 14);       // wingtip right
  ctx.lineTo(3, 3);         // forward edge right
  ctx.closePath();
  ctx.fill();

  // Subtle engine glow at back center
  ctx.fillStyle = 'rgba(123, 104, 238, 0.6)';
  ctx.beginPath();
  ctx.ellipse(-5, 0, 2, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ammo indicator — small dots along belly
  if (entity.ammoState && entity.ammoState.remaining > 0) {
    ctx.fillStyle = 'rgba(76, 144, 240, 0.8)';
    const count = Math.min(entity.ammoState.remaining, 12);
    for (let i = 0; i < count; i++) {
      const x = 4 - i * 1.2;
      ctx.beginPath();
      ctx.arc(x, 0, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('BMRR', screen.x + 16, screen.y + 3);
}
