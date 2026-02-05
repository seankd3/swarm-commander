import type { GameState, Entity } from '../simulation/types';
import { PLAY_AREA } from '../simulation/types';
import type { Camera } from './camera';
import { worldToScreen } from './camera';
import { COLORS } from './colors';

/** Main rendering function — draws the entire game state to a canvas */
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
): void {
  const { viewportWidth: w, viewportHeight: h } = camera;

  // Clear
  ctx.fillStyle = COLORS.ocean;
  ctx.fillRect(0, 0, w, h);

  drawGrid(ctx, camera);
  drawPlayArea(ctx, camera);
  drawEntities(ctx, state, camera);
}

/** Draw lat/lon grid lines */
function drawGrid(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const { viewportWidth: w, viewportHeight: h } = camera;

  // Determine grid spacing based on zoom
  let gridStep = 1; // 1 degree
  if (camera.zoom > 2000) gridStep = 0.1;
  else if (camera.zoom > 500) gridStep = 0.5;

  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 0.5;
  ctx.font = '10px Courier New';
  ctx.fillStyle = COLORS.gridLabel;

  // Calculate visible lat/lon range
  const topLeft = { lat: camera.centerLat + h / 2 / camera.zoom, lon: camera.centerLon - w / 2 / camera.zoom };
  const bottomRight = { lat: camera.centerLat - h / 2 / camera.zoom, lon: camera.centerLon + w / 2 / camera.zoom };

  const startLon = Math.floor(topLeft.lon / gridStep) * gridStep;
  const endLon = Math.ceil(bottomRight.lon / gridStep) * gridStep;
  const startLat = Math.floor(bottomRight.lat / gridStep) * gridStep;
  const endLat = Math.ceil(topLeft.lat / gridStep) * gridStep;

  // Longitude lines (vertical)
  for (let lon = startLon; lon <= endLon; lon += gridStep) {
    const screen = worldToScreen(camera, { lat: 0, lon });
    ctx.beginPath();
    ctx.moveTo(screen.x, 0);
    ctx.lineTo(screen.x, h);
    ctx.stroke();

    // Label
    if (screen.x > 30 && screen.x < w - 30) {
      ctx.fillText(`${lon.toFixed(1)}E`, screen.x + 3, h - 5);
    }
  }

  // Latitude lines (horizontal)
  for (let lat = startLat; lat <= endLat; lat += gridStep) {
    const screen = worldToScreen(camera, { lat, lon: 0 });
    ctx.beginPath();
    ctx.moveTo(0, screen.y);
    ctx.lineTo(w, screen.y);
    ctx.stroke();

    // Label
    if (screen.y > 15 && screen.y < h - 15) {
      ctx.fillText(`${lat.toFixed(1)}N`, 5, screen.y - 3);
    }
  }
}

/** Draw the play area boundary */
function drawPlayArea(ctx: CanvasRenderingContext2D, camera: Camera): void {
  const tl = worldToScreen(camera, { lat: PLAY_AREA.north, lon: PLAY_AREA.west });
  const br = worldToScreen(camera, { lat: PLAY_AREA.south, lon: PLAY_AREA.east });

  // Fill
  ctx.fillStyle = COLORS.playAreaFill;
  ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

  // Border
  ctx.strokeStyle = COLORS.playAreaBorder;
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 4]);
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.setLineDash([]);
}

/** Draw all entities */
function drawEntities(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
): void {
  for (const entity of state.entities.values()) {
    if (entity.type === 'MPA') {
      drawMPA(ctx, entity, camera);
    }
  }
}

/** Draw the Maritime Patrol Aircraft */
function drawMPA(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  const screen = worldToScreen(camera, entity.position);

  // Draw destination line and marker if moving
  if (entity.destination) {
    const destScreen = worldToScreen(camera, entity.destination);

    // Dashed line to destination
    ctx.strokeStyle = COLORS.mpaDestLine;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(screen.x, screen.y);
    ctx.lineTo(destScreen.x, destScreen.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Destination marker (small cross)
    ctx.strokeStyle = COLORS.mpaDestination;
    ctx.lineWidth = 1;
    const cs = 6;
    ctx.beginPath();
    ctx.moveTo(destScreen.x - cs, destScreen.y);
    ctx.lineTo(destScreen.x + cs, destScreen.y);
    ctx.moveTo(destScreen.x, destScreen.y - cs);
    ctx.lineTo(destScreen.x, destScreen.y + cs);
    ctx.stroke();
  }

  // Draw aircraft icon
  const size = 10;
  const headingRad = (entity.velocity.heading - 90) * Math.PI / 180;

  ctx.save();
  ctx.translate(screen.x, screen.y);
  ctx.rotate(headingRad);

  // Glow effect
  ctx.shadowColor = COLORS.mpaBody;
  ctx.shadowBlur = 8;

  // Aircraft shape: simple arrow
  ctx.fillStyle = COLORS.mpaBody;
  ctx.beginPath();
  ctx.moveTo(size, 0); // nose
  ctx.lineTo(-size * 0.6, -size * 0.5); // left wing
  ctx.lineTo(-size * 0.3, 0); // fuselage indent
  ctx.lineTo(-size * 0.6, size * 0.5); // right wing
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.restore();

  // Label
  ctx.fillStyle = COLORS.mpaBody;
  ctx.font = '10px Courier New';
  ctx.fillText('MPA-1', screen.x + size + 4, screen.y + 4);
}
