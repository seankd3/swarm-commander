// --- Terrain Layer ---
// Grid overlay and play area boundary. Base terrain provided by MapLibre.

import type { GameState } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';

export function drawGrid(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const { viewportWidth: w, viewportHeight: h } = camera;

  let gridStep = 0.5;
  if (camera.zoom > 3000) gridStep = 0.05;
  else if (camera.zoom > 1000) gridStep = 0.1;

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  ctx.font = '10px Courier New';
  ctx.fillStyle = COLORS.gridLabel;

  const topLeft = { lat: camera.centerLat + h / 2 / camera.zoom, lon: camera.centerLon - w / 2 / camera.zoom };
  const bottomRight = { lat: camera.centerLat - h / 2 / camera.zoom, lon: camera.centerLon + w / 2 / camera.zoom };

  const startLon = Math.floor(topLeft.lon / gridStep) * gridStep;
  const endLon = Math.ceil(bottomRight.lon / gridStep) * gridStep;
  const startLat = Math.floor(bottomRight.lat / gridStep) * gridStep;
  const endLat = Math.ceil(topLeft.lat / gridStep) * gridStep;

  for (let lon = startLon; lon <= endLon; lon += gridStep) {
    const screen = worldToScreen(camera, { lat: 0, lon });
    ctx.beginPath();
    ctx.moveTo(screen.x, 0);
    ctx.lineTo(screen.x, h);
    ctx.stroke();
    if (screen.x > 30 && screen.x < w - 30) {
      ctx.fillText(`${lon.toFixed(2)}°E`, screen.x + 3, h - 5);
    }
  }

  for (let lat = startLat; lat <= endLat; lat += gridStep) {
    const screen = worldToScreen(camera, { lat, lon: 0 });
    ctx.beginPath();
    ctx.moveTo(0, screen.y);
    ctx.lineTo(w, screen.y);
    ctx.stroke();
    if (screen.y > 15 && screen.y < h - 15) {
      ctx.fillText(`${lat.toFixed(2)}°N`, 5, screen.y - 3);
    }
  }
}

export function drawPlayArea(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  const playArea = state.playArea;
  if (!playArea) return;

  const { viewportWidth: w, viewportHeight: h } = camera;
  const tl = worldToScreen(camera, { lat: playArea.north, lon: playArea.west });
  const br = worldToScreen(camera, { lat: playArea.south, lon: playArea.east });

  // Darken area outside play bounds (vignette effect)
  ctx.fillStyle = COLORS.playAreaFill;
  ctx.fillRect(0, 0, w, tl.y);                         // top strip
  ctx.fillRect(0, br.y, w, h - br.y);                   // bottom strip
  ctx.fillRect(0, tl.y, tl.x, br.y - tl.y);            // left strip
  ctx.fillRect(br.x, tl.y, w - br.x, br.y - tl.y);     // right strip

  // Dashed border around play area
  ctx.strokeStyle = COLORS.playAreaBorder;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.setLineDash([]);
}
