// --- Contact Layer ---
// Shared COP contact markers (diamonds for stale/fading contacts).

import type { GameState } from '../../simulation/types';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';

export function drawContacts(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const contact of state.contacts.values()) {
    const entity = state.entities.get(contact.entityId);
    if (entity && entity.isDetected && entity.state !== 'DESTROYED') continue;

    const screen = worldToScreen(camera, contact.position);
    const color = contact.isLive ? COLORS.contactLive : COLORS.contactStale;

    ctx.save();
    ctx.translate(screen.x, screen.y);

    ctx.fillStyle = color;
    ctx.globalAlpha = contact.isLive ? 0.8 : 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(5, 0);
    ctx.lineTo(0, 6);
    ctx.lineTo(-5, 0);
    ctx.closePath();
    ctx.fill();

    if (!contact.entityType) {
      ctx.fillStyle = '#fff';
      ctx.font = '8px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('?', 0, 3);
      ctx.textAlign = 'left';
    }

    ctx.globalAlpha = 1;
    ctx.restore();

    ctx.fillStyle = color;
    ctx.globalAlpha = contact.isLive ? 0.8 : 0.4;
    ctx.font = '7px Courier New';
    ctx.fillText(contact.entityType ?? 'UNK', screen.x + 8, screen.y + 3);
    ctx.globalAlpha = 1;
  }
}
