// --- Missile Layer ---
// Missile projectiles + trails. Color-coded by faction.

import type { GameState } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';

export function drawMissiles(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const missile of state.missiles) {
    const screen = worldToScreen(camera, missile.position);
    const headingRad = ((missile.heading - 90) * Math.PI) / 180;

    // Color by faction
    const isBlue = missile.faction === 'BLUE';
    const bodyColor = isBlue ? COLORS.blueMissileBody : COLORS.missileBody;
    const trailColor = isBlue ? COLORS.blueMissileTrail : COLORS.missileTrail;

    const trailLen = isBlue ? 16 : 12;
    const trailX = screen.x - Math.cos(headingRad) * trailLen;
    const trailY = screen.y - Math.sin(headingRad) * trailLen;
    ctx.strokeStyle = trailColor;
    ctx.lineWidth = isBlue ? 2.5 : 2;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(screen.x, screen.y);
    ctx.stroke();

    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = isBlue ? 8 : 6;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, isBlue ? 3.5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}
