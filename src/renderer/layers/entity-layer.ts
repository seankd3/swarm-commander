// --- Entity Layer ---
// Draws all entities via platform-driven draw function dispatch.

import type { GameState, Entity } from '../../simulation/types';
import { getPlatform } from '../../platforms/platform-registry';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { drawSpecter } from '../draw-fns/draw-specter';
import { drawHornet } from '../draw-fns/draw-hornet';
import { drawRadarSite } from '../draw-fns/draw-radar-site';
import { drawSAMLauncher } from '../draw-fns/draw-sam-launcher';
import { drawBase } from '../draw-fns/draw-base';
import { drawCommandPost } from '../draw-fns/draw-command-post';
import { drawMobileSam } from '../draw-fns/draw-mobile-sam';
import { drawEwRadar } from '../draw-fns/draw-ew-radar';
import { drawFury } from '../draw-fns/draw-fury';
import { drawStealthBomber } from '../draw-fns/draw-stealth-bomber';

/** Draw destination line and marker */
function drawDestinationLine(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  if (!entity.destination) return;

  const screen = worldToScreen(camera, entity.position);
  const destScreen = worldToScreen(camera, entity.destination);

  ctx.strokeStyle = COLORS.blueDestLine;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y);
  ctx.lineTo(destScreen.x, destScreen.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = COLORS.blueDestination;
  const cs = 5;
  ctx.beginPath();
  ctx.moveTo(destScreen.x - cs, destScreen.y);
  ctx.lineTo(destScreen.x + cs, destScreen.y);
  ctx.moveTo(destScreen.x, destScreen.y - cs);
  ctx.lineTo(destScreen.x, destScreen.y + cs);
  ctx.stroke();
}

export function drawEntities(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  // Destination lines first (under units)
  for (const entity of state.entities.values()) {
    if (entity.faction === 'BLUE' && entity.destination && entity.state !== 'DESTROYED') {
      drawDestinationLine(ctx, entity, camera);
    }
  }

  // Units
  for (const entity of state.entities.values()) {
    if (entity.faction === 'RED' && !entity.isDetected && entity.state !== 'DESTROYED') continue;
    if (entity.flightState === 'PARKED') continue; // parked aircraft are hidden

    const isSelected = state.selection.selectedIds.has(entity.id);
    const platform = getPlatform(entity.platformId);

    switch (platform.render.drawFn) {
      case 'specter':
        drawSpecter(ctx, entity, camera, isSelected);
        break;
      case 'hornet':
        drawHornet(ctx, entity, camera, isSelected);
        break;
      case 'radar-site':
        drawRadarSite(ctx, entity, camera);
        break;
      case 'sam-launcher':
        drawSAMLauncher(ctx, entity, camera);
        break;
      case 'base':
        drawBase(ctx, entity, camera, isSelected, state.time.elapsed);
        break;
      case 'command-post':
        drawCommandPost(ctx, entity, camera);
        break;
      case 'mobile-sam':
        drawMobileSam(ctx, entity, camera);
        break;
      case 'ew-radar':
        drawEwRadar(ctx, entity, camera);
        break;
      case 'fury':
        drawFury(ctx, entity, camera, isSelected);
        break;
      case 'stealth-bomber':
        drawStealthBomber(ctx, entity, camera, isSelected);
        break;
    }
  }
}
