// --- Contacts System ---
// Shared COP (Common Operating Picture) management. Pure function.

import type { Entity, EntityId, Contact } from '../types';
import { CONTACT_PERSISTENCE } from '../types';

let contactCounter = 0;

/** Update the shared contact picture based on current sensor detections */
export function runContactsSystem(
  contacts: Map<string, Contact>,
  entities: Map<EntityId, Entity>,
  gameTime: number,
): Map<string, Contact> {
  const updated = new Map(contacts);

  // Find all detected RED entities (from BLUE's perspective)
  for (const entity of entities.values()) {
    if (entity.faction !== 'RED' || entity.state === 'DESTROYED') continue;

    if (entity.isDetected) {
      // Find existing contact for this entity
      let existingId: string | null = null;
      for (const [cid, contact] of updated) {
        if (contact.entityId === entity.id) {
          existingId = cid;
          break;
        }
      }

      if (existingId) {
        const existing = updated.get(existingId)!;
        updated.set(existingId, {
          ...existing,
          position: entity.position,
          entityType: entity.platformId,
          lastSeen: gameTime,
          isLive: true,
        });
      } else {
        const id = `contact-${++contactCounter}`;
        updated.set(id, {
          id,
          entityId: entity.id,
          position: entity.position,
          entityType: entity.platformId,
          faction: 'RED',
          firstDetected: gameTime,
          lastSeen: gameTime,
          isLive: true,
        });
      }
    } else {
      // Entity not currently detected — mark contact stale
      for (const [cid, contact] of updated) {
        if (contact.entityId === entity.id && contact.isLive) {
          updated.set(cid, { ...contact, isLive: false });
        }
      }
    }
  }

  // Expire old contacts
  for (const [cid, contact] of updated) {
    if (!contact.isLive && gameTime - contact.lastSeen > CONTACT_PERSISTENCE) {
      updated.delete(cid);
    }
  }

  // Remove contacts for destroyed entities
  for (const [cid, contact] of updated) {
    const entity = entities.get(contact.entityId);
    if (entity && entity.state === 'DESTROYED') {
      updated.delete(cid);
    }
  }

  return updated;
}
