// --- UI Layer ---
// Selection box, RWR warnings, task areas, placement preview, mission result.

import type { GameState } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { metersToPixels } from '../render-utils';
import type { RenderOptions } from '../canvas-renderer';

export function drawSelectionBox(ctx: CanvasRenderingContext2D, state: GameState): void {
  const { boxStart, boxEnd } = state.selection;
  if (!boxStart || !boxEnd) return;

  const x = Math.min(boxStart.x, boxEnd.x);
  const y = Math.min(boxStart.y, boxEnd.y);
  const w = Math.abs(boxEnd.x - boxStart.x);
  const h = Math.abs(boxEnd.y - boxStart.y);

  ctx.fillStyle = COLORS.selectionBox;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = COLORS.selectionBoxBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

export function drawRWRWarnings(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const entity of state.entities.values()) {
    if (entity.faction !== 'BLUE' || entity.state === 'DESTROYED') continue;
    if (entity.detectedBy.length === 0) continue;

    const screen = worldToScreen(camera, entity.position);
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);

    ctx.save();
    ctx.translate(screen.x + 16, screen.y - 12);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.rwrWarning;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(3, 0);
    ctx.lineTo(0, 4);
    ctx.lineTo(-3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.fillStyle = COLORS.rwrWarning;
    ctx.globalAlpha = pulse;
    ctx.font = '7px Courier New';
    ctx.fillText('RWR', screen.x + 22, screen.y - 9);
    ctx.globalAlpha = 1;
  }
}

function getROEColors(roe: string): { fill: string; border: string } {
  switch (roe) {
    case 'WEAPONS_TIGHT': return { fill: COLORS.roeTightArea, border: COLORS.roeTightBorder };
    case 'WEAPONS_FREE': return { fill: COLORS.roeFreeArea, border: COLORS.roeFreeBorder };
    default: return { fill: COLORS.roeHoldArea, border: COLORS.roeHoldBorder };
  }
}

function roeLabel(roe: string): string {
  switch (roe) {
    case 'WEAPONS_TIGHT': return 'TIGHT';
    case 'WEAPONS_FREE': return 'FREE';
    default: return 'HOLD';
  }
}

export function drawTaskAreas(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const task of state.tasks) {
    if (task.status === 'COMPLETE' || task.status === 'FAILED') continue;

    if (task.type === 'RECON_AREA' || task.type === 'PATROL') {
      const screen = worldToScreen(camera, task.area.center);
      const radiusPixels = metersToPixels(camera, task.area.radius);
      const isRecon = task.type === 'RECON_AREA';
      const roeColors = getROEColors(task.params.roe);

      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radiusPixels, 0, Math.PI * 2);
      ctx.fillStyle = roeColors.fill;
      ctx.fill();
      ctx.strokeStyle = roeColors.border;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = roeColors.border;
      ctx.font = '9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${isRecon ? 'RECON' : 'PATROL'} [${roeLabel(task.params.roe)}]`,
        screen.x, screen.y - radiusPixels - 4,
      );
      ctx.textAlign = 'left';
    }

    if (task.type === 'STRIKE_ON_DETECT' && task.watchArea) {
      const screen = worldToScreen(camera, task.watchArea.center);
      const radiusPixels = metersToPixels(camera, task.watchArea.radius);

      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radiusPixels, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.watchArea;
      ctx.fill();
      ctx.strokeStyle = COLORS.watchAreaBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.watchAreaBorder;
      ctx.font = '9px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(
        `STRIKE IF [${roeLabel(task.params.roe)}]`,
        screen.x, screen.y - radiusPixels - 4,
      );
      ctx.textAlign = 'left';
    }
  }
}

export function drawPlacementPreview(ctx: CanvasRenderingContext2D, camera: Camera, options: RenderOptions): void {
  if (!options.mouseScreenPos || !options.selectedAreaRadius) return;

  const radiusPixels = metersToPixels(camera, options.selectedAreaRadius);
  const { x, y } = options.mouseScreenPos;

  let previewColor: string;
  switch (options.selectedTaskType) {
    case 'PATROL': previewColor = '50, 164, 103'; break;
    case 'STRIKE_ON_DETECT':
    case 'STRIKE_TARGET': previewColor = '236, 154, 60'; break;
    default: previewColor = '76, 144, 240';
  }

  ctx.beginPath();
  ctx.arc(x, y, radiusPixels, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${previewColor}, 0.08)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${previewColor}, 0.4)`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 3]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = `rgba(${previewColor}, 0.5)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x + 8, y);
  ctx.moveTo(x, y - 8);
  ctx.lineTo(x, y + 8);
  ctx.stroke();
}

export function drawMissionResult(ctx: CanvasRenderingContext2D, state: GameState, w: number, h: number): void {
  if (state.missionResult === 'PENDING') return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, w, h);

  ctx.font = 'bold 48px Courier New';
  ctx.textAlign = 'center';

  if (state.missionResult === 'VICTORY') {
    ctx.fillStyle = COLORS.victory;
    ctx.fillText('MISSION COMPLETE', w / 2, h / 2 - 20);
    ctx.font = '20px Courier New';
    ctx.fillText(state.victoryText, w / 2, h / 2 + 20);
  } else {
    ctx.fillStyle = COLORS.defeat;
    ctx.fillText('MISSION FAILED', w / 2, h / 2 - 20);
    ctx.font = '20px Courier New';
    ctx.fillText(state.defeatText, w / 2, h / 2 + 20);
  }

  // Return hint
  ctx.font = '14px Courier New';
  ctx.fillStyle = COLORS.textMuted;
  ctx.fillText('Press ESC to return to missions', w / 2, h / 2 + 60);

  ctx.textAlign = 'left';
}
