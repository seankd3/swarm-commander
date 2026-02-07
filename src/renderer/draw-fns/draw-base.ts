// --- Draw Base ---
// Airbase/FARP marker with parked aircraft count.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker, drawSelectionRing } from './draw-common';
import { getLaunchQueueInfo } from '../../simulation/systems/runway-ops';

export function drawBase(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera, isSelected: boolean, gameTime?: number): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  if (isSelected) drawSelectionRing(ctx, screen.x, screen.y, 20);

  const color = entity.faction === 'BLUE' ? COLORS.blueUnit : COLORS.redUnit;
  const x = screen.x;
  const y = screen.y;

  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;

  // Outer runway rectangle
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 12, y - 6, 24, 12);

  // Runway stripe
  ctx.fillStyle = color;
  ctx.fillRect(x - 9, y - 0.5, 18, 1);

  // Cross stripe (taxiway)
  ctx.fillRect(x - 0.5, y - 4, 1, 8);

  ctx.shadowBlur = 0;
  ctx.restore();

  // Parked count badge
  const parkedCount = entity.baseState?.parkedAircraft.length ?? 0;
  if (parkedCount > 0) {
    ctx.fillStyle = COLORS.panelElevated;
    ctx.beginPath();
    ctx.arc(x + 14, y - 8, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.font = 'bold 8px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(parkedCount), x + 14, y - 8);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('BASE', x + 16, y + 3);

  // Launch queue indicator
  if (gameTime !== undefined) {
    const queueInfo = getLaunchQueueInfo(entity, gameTime);
    if (queueInfo) {
      const label = `Q:${queueInfo.queueLength} ${queueInfo.countdown}s`;
      ctx.font = 'bold 7px Courier New';
      const textWidth = ctx.measureText(label).width;
      const pillW = textWidth + 8;
      const pillH = 12;
      const pillX = x - pillW / 2;
      const pillY = y + 12;

      // Dark pill background
      ctx.fillStyle = COLORS.panelElevated;
      ctx.beginPath();
      ctx.roundRect(pillX, pillY, pillW, pillH, 3);
      ctx.fill();

      // Text
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, pillY + pillH / 2);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  }
}
