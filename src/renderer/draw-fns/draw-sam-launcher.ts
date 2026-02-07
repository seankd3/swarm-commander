// --- Draw SAM Launcher ---
// Surface-to-air missile launcher with angled tubes.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker } from './draw-common';

export function drawSAMLauncher(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  const color = COLORS.redUnit;

  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  ctx.save();
  ctx.translate(screen.x, screen.y);

  // Chassis
  ctx.fillStyle = COLORS.redUnitDark;
  ctx.fillRect(-8, -4, 16, 8);

  // Wheels
  ctx.fillStyle = '#3a1515';
  ctx.fillRect(-8, -5, 4, 2);
  ctx.fillRect(-8, 3, 4, 2);
  ctx.fillRect(4, -5, 4, 2);
  ctx.fillRect(4, 3, 4, 2);

  // Launcher tubes
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  for (let i = -1; i <= 1; i++) {
    const baseX = i * 3;
    ctx.beginPath();
    ctx.moveTo(baseX, 0);
    ctx.lineTo(baseX - 5, -10);
    ctx.stroke();

    ctx.fillStyle = '#ff6666';
    ctx.beginPath();
    ctx.arc(baseX - 5, -10, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('SAM', screen.x + 14, screen.y + 3);
}
