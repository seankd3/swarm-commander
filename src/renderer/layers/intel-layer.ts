// --- Intel Layer ---
// Draws pre-mission intel markers (threat positions, uncertainty zones) on the
// game map so the player retains situational awareness from the briefing.

import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import type { IntelMarker } from '../../scenarios/scenario-types';

/** Approximate meters → screen pixels using camera projection */
function metersToPixels(camera: Camera, meters: number, lat: number): number {
  const metersPerDeg = 111320 * Math.cos(lat * Math.PI / 180);
  const degSpan = meters / metersPerDeg;
  const center = worldToScreen(camera, { lat, lon: 0 });
  const edge = worldToScreen(camera, { lat, lon: degSpan });
  return Math.abs(edge.x - center.x);
}

/** Draw all intel markers from the scenario briefing onto the game canvas */
export function drawIntelMarkers(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  markers: IntelMarker[],
): void {
  // Pass 1: estimated radius zones (drawn underneath)
  for (const marker of markers) {
    if (marker.radiusMeters <= 0) continue;
    const p = worldToScreen(camera, marker.position);
    const r = metersToPixels(camera, marker.radiusMeters, marker.position.lat);
    if (r < 2) continue;

    if (marker.accuracy === 'ESTIMATED') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = marker.threatType === 'SAM'
        ? 'rgba(231, 106, 110, 0.05)'
        : 'rgba(236, 154, 60, 0.04)';
      ctx.fill();
      ctx.strokeStyle = marker.threatType === 'SAM'
        ? 'rgba(231, 106, 110, 0.2)'
        : 'rgba(236, 154, 60, 0.18)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Pass 2: confirmed point markers
  for (const marker of markers) {
    if (marker.radiusMeters > 0 && marker.accuracy !== 'CONFIRMED') continue;
    const p = worldToScreen(camera, marker.position);
    const color = marker.accuracy === 'CONFIRMED'
      ? 'rgba(231, 106, 110, 0.5)'
      : 'rgba(236, 154, 60, 0.4)';
    const size = 5;

    if (marker.threatType === 'SAM') {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - size);
      ctx.lineTo(p.x + size, p.y);
      ctx.lineTo(p.x, p.y + size);
      ctx.lineTo(p.x - size, p.y);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else if (marker.threatType === 'RADAR' || marker.threatType === 'EW') {
      // Triangle
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - size);
      ctx.lineTo(p.x + size, p.y + size);
      ctx.lineTo(p.x - size, p.y + size);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    } else if (marker.threatType === 'COMMAND') {
      // Square
      ctx.fillStyle = color;
      ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    } else {
      // Circle
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    // Label (subtle)
    ctx.font = '8px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(171, 179, 191, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(marker.label, p.x, p.y + size + 10);
  }
}
