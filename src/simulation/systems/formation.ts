// --- Active Formation System ---
// Units actively adjust speed/heading to maintain formation spacing relative to a lead unit.
// Lead is determined by role (task executor sets formation params).
// Wingmen adjust speed to match lead's speed and maintain relative position.

import type { Entity, EntityId, Task } from '../types';
import { distanceMeters, bearingDegrees, movePosition, normalizeHeading } from '../geo';
import { getPlatform } from '../../platforms/platform-registry';

const FORMATION_TOLERANCE = 300;    // meters — distance before correction kicks in
const FORMATION_SPEED_ADJUST = 0.15; // fraction — how much wingmen adjust speed
const FORMATION_HEADING_BLEND = 0.3; // how aggressively to turn toward formation position

/** Get the lead entity ID for a group of assigned entities.
 * Lead is the first entity that's alive and has the longest-range sensor (ISR leads).
 * Falls back to first alive entity. */
function findLeadEntity(assignedIds: EntityId[], entities: Map<EntityId, Entity>): EntityId | null {
  let bestLead: EntityId | null = null;
  let bestSensorRange = -1;

  for (const id of assignedIds) {
    const entity = entities.get(id);
    if (!entity || entity.state === 'DESTROYED') continue;

    if (!bestLead) bestLead = id; // fallback: first alive

    const plat = getPlatform(entity.platformId);
    const sensorRange = plat.sensor?.range ?? 0;
    if (sensorRange > bestSensorRange) {
      bestSensorRange = sensorRange;
      bestLead = id;
    }
  }

  return bestLead;
}

/** Calculate where a wingman should be relative to the lead */
function getWingmanPosition(
  leadPos: { lat: number; lon: number },
  leadHeading: number,
  wingmanIndex: number,
  _totalWingmen: number,
  spacing: number,
): { lat: number; lon: number } {
  // V-formation: wingmen alternate left and right behind lead
  const side = wingmanIndex % 2 === 0 ? 1 : -1;
  const row = Math.ceil((wingmanIndex + 1) / 2);

  // Offset behind lead
  const behindHeading = normalizeHeading(leadHeading + 180);
  const lateralHeading = normalizeHeading(leadHeading + (side * 90));

  const behindDist = row * spacing * 0.7;
  const lateralDist = side * row * spacing * 0.5;

  let pos = movePosition(leadPos, behindHeading, behindDist);
  pos = movePosition(pos, lateralHeading, Math.abs(lateralDist));
  return pos;
}

/** Run active formation keeping for all multi-entity tasks */
export function runFormationSystem(
  entities: Map<EntityId, Entity>,
  tasks: Task[],
): Map<EntityId, Entity> {
  const updated = new Map(entities);
  const processed = new Set<EntityId>();

  for (const task of tasks) {
    if (task.status !== 'ACTIVE') continue;
    if (task.assignedIds.length <= 1) continue;
    if (task.params.formation === 'NONE') continue;

    const leadId = findLeadEntity(task.assignedIds, updated);
    if (!leadId) continue;

    const lead = updated.get(leadId);
    if (!lead || lead.state === 'DESTROYED') continue;
    if (lead.state !== 'TRANSIT') continue; // Only form up when moving

    processed.add(leadId);

    // Compute formation speed: use the SLOWEST unit's maxSpeed so everyone can keep up
    let minMaxSpeed = Infinity;
    for (const id of task.assignedIds) {
      const e = updated.get(id);
      if (!e || e.state === 'DESTROYED') continue;
      if (e.maxSpeed < minMaxSpeed) minMaxSpeed = e.maxSpeed;
    }
    const formationSpeed = isFinite(minMaxSpeed) ? minMaxSpeed * task.params.speedFraction : lead.velocity.speed;

    // Cap lead speed to formation speed
    if (lead.velocity.speed > formationSpeed * 1.1) {
      updated.set(leadId, {
        ...lead,
        velocity: { ...lead.velocity, speed: formationSpeed },
      });
    }

    // Get wingmen (all non-lead alive entities)
    const wingmen = task.assignedIds.filter(id => id !== leadId);
    let wingIdx = 0;

    for (const wid of wingmen) {
      const wingman = updated.get(wid);
      if (!wingman || wingman.state === 'DESTROYED') continue;
      if (wingman.state === 'ATTACKING') continue; // Don't adjust during attack run
      if (processed.has(wid)) continue;
      processed.add(wid);

      const targetPos = getWingmanPosition(
        lead.position, lead.heading,
        wingIdx, wingmen.length,
        task.params.spacing,
      );
      wingIdx++;

      const dist = distanceMeters(wingman.position, targetPos);
      if (dist < FORMATION_TOLERANCE) continue; // Close enough

      // Adjust heading to blend toward formation position
      const toFormation = bearingDegrees(wingman.position, targetPos);
      const currentHeading = wingman.velocity.heading;
      let headingDiff = toFormation - currentHeading;
      if (headingDiff > 180) headingDiff -= 360;
      if (headingDiff < -180) headingDiff += 360;
      const newHeading = normalizeHeading(currentHeading + headingDiff * FORMATION_HEADING_BLEND);

      // Adjust speed relative to formation speed: faster if behind, slower if ahead
      const leadDist = distanceMeters(wingman.position, lead.position);
      const idealDist = task.params.spacing;
      let speedAdj = 1.0;
      if (leadDist > idealDist * 1.2) {
        speedAdj = 1.0 + FORMATION_SPEED_ADJUST; // speed up to catch up
      } else if (leadDist < idealDist * 0.8) {
        speedAdj = 1.0 - FORMATION_SPEED_ADJUST; // slow down
      }

      const targetSpeed = Math.min(
        formationSpeed * speedAdj,
        wingman.maxSpeed,
      );

      updated.set(wid, {
        ...wingman,
        heading: newHeading,
        velocity: { heading: newHeading, speed: Math.max(targetSpeed, 0) },
      });
    }
  }

  return updated;
}
