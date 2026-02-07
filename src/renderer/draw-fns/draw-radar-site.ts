// --- Draw Radar Site ---
// Ground-based surveillance radar with rotating antenna.

import type { Entity } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawDestroyedMarker } from './draw-common';

export function drawRadarSite(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  const screen = worldToScreen(camera, entity.position);

  if (entity.state === 'DESTROYED') {
    drawDestroyedMarker(ctx, screen.x, screen.y);
    return;
  }

  const color = COLORS.redUnit;
  const antennaAngle = ((entity.sensor?.currentAngle ?? 0) - 90) * Math.PI / 180;

  ctx.shadowColor = color;
  ctx.shadowBlur = 8;

  // Base platform — octagon
  ctx.fillStyle = COLORS.redUnitDark;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 - Math.PI / 8;
    const r = 6;
    const px = screen.x + Math.cos(a) * r;
    const py = screen.y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Central hub
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
  ctx.fill();

  // Rotating antenna arm
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y);
  const armLen = 12;
  const armX = screen.x + Math.cos(antennaAngle) * armLen;
  const armY = screen.y + Math.sin(antennaAngle) * armLen;
  ctx.lineTo(armX, armY);
  ctx.stroke();

  // Dish at arm end
  const dishRadius = 5;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(armX, armY, dishRadius, antennaAngle - Math.PI / 2 - 0.6, antennaAngle - Math.PI / 2 + 0.6);
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Label
  ctx.fillStyle = color;
  ctx.font = '8px Courier New';
  ctx.fillText('RADAR', screen.x + 14, screen.y + 3);
}
