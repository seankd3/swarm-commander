// --- Planner Layer ---
// Draws AO circle, ingress/egress vector arrows, and staging positions on the map
// during mission planning.

import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import type { Position } from '../../simulation/types';

export interface PlannerOverlay {
  targetPosition: Position | null;
  targetRadius: number;        // meters
  ingressPoint: Position | null;
  egressPoint: Position | null;
}

/** Approximate conversion from meters to screen pixels */
function metersToPixels(camera: Camera, meters: number, lat: number): number {
  // At the equator, 1 degree ~= 111320 meters. Adjust for latitude.
  const metersPerDeg = 111320 * Math.cos(lat * Math.PI / 180);
  const degSpan = meters / metersPerDeg;
  // Convert degrees to pixels using world-to-screen
  const center = worldToScreen(camera, { lat, lon: 0 });
  const edge = worldToScreen(camera, { lat, lon: degSpan });
  return Math.abs(edge.x - center.x);
}

/** Draw AO circle at target position */
export function drawAOCircle(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  target: Position,
  radiusMeters: number,
): void {
  const center = worldToScreen(camera, target);
  const rPx = metersToPixels(camera, radiusMeters, target.lat);

  // Fill
  ctx.beginPath();
  ctx.arc(center.x, center.y, rPx, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(76, 144, 240, 0.06)';
  ctx.fill();

  // Dashed border
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = 'rgba(76, 144, 240, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Center crosshair
  const size = 6;
  ctx.strokeStyle = 'rgba(76, 144, 240, 0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(center.x - size, center.y);
  ctx.lineTo(center.x + size, center.y);
  ctx.moveTo(center.x, center.y - size);
  ctx.lineTo(center.x, center.y + size);
  ctx.stroke();

  // Label
  ctx.font = '9px -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(76, 144, 240, 0.7)';
  ctx.textAlign = 'center';
  ctx.fillText(`AO ${(radiusMeters / 1000).toFixed(0)}km`, center.x, center.y - rPx - 6);
}

/** Draw an arrowhead at the tip of a line */
function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  color: string,
  size: number,
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - size * Math.cos(angle - Math.PI / 6), to.y - size * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(to.x - size * Math.cos(angle + Math.PI / 6), to.y - size * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

/** Draw ingress vector arrow: from the clicked ingress point toward the AO center */
export function drawIngressVector(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  ingressPoint: Position,
  aoCenter: Position,
): void {
  const from = worldToScreen(camera, ingressPoint);
  const to = worldToScreen(camera, aoCenter);
  const color = '#32A467';

  // Line from ingress → AO
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead at AO end
  drawArrowhead(ctx, from, to, color, 10);

  // Diamond marker at ingress origin
  const size = 5;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y - size);
  ctx.lineTo(from.x + size, from.y);
  ctx.lineTo(from.x, from.y + size);
  ctx.lineTo(from.x - size, from.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.font = '8px -apple-system, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText('INGRESS', from.x, from.y + size + 12);
}

/** Draw egress vector arrow: from AO center toward the clicked egress point */
export function drawEgressVector(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  egressPoint: Position,
  aoCenter: Position,
): void {
  const from = worldToScreen(camera, aoCenter);
  const to = worldToScreen(camera, egressPoint);
  const color = '#EC9A3C';

  // Line from AO → egress
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrowhead at egress end
  drawArrowhead(ctx, from, to, color, 10);

  // Diamond marker at egress destination
  const size = 5;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y - size);
  ctx.lineTo(to.x + size, to.y);
  ctx.lineTo(to.x, to.y + size);
  ctx.lineTo(to.x - size, to.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.font = '8px -apple-system, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText('EGRESS', to.x, to.y + size + 12);
}
