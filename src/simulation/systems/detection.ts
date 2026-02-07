// --- Detection System ---
// Cross-faction sensor detection. Pure function.

import type { Entity, EntityId, Position } from '../types';
import { RADAR_CROSS_SECTION } from '../types';
import { distanceMeters, bearingDegrees, normalizeHeading } from '../geo';

/** Check if a position falls within a sensor's detection cone */
export function isInSensorCone(observer: Entity, targetPos: Position, targetEntity?: Entity): boolean {
  if (!observer.sensor) return false;
  if (observer.radarMode === 'PASSIVE' && observer.sensor.type === 'RADAR') return false;

  let effectiveRange = observer.sensor.range;
  if (targetEntity && observer.sensor.type === 'RADAR') {
    effectiveRange *= (targetEntity.rcs ?? 1.0) * RADAR_CROSS_SECTION[targetEntity.radarMode];
  }

  const dist = distanceMeters(observer.position, targetPos);
  if (dist > effectiveRange) return false;

  if (observer.sensor.fieldOfView >= 360) return true;

  const bearing = bearingDegrees(observer.position, targetPos);
  const sensorDir = normalizeHeading(observer.heading + observer.sensor.currentAngle);
  let angleDiff = Math.abs(normalizeHeading(bearing - sensorDir));
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  return angleDiff <= observer.sensor.fieldOfView / 2;
}

/** Update detection: each faction's sensors detect the other's entities */
export function runDetectionSystem(entities: Map<EntityId, Entity>): Map<EntityId, Entity> {
  const updated = new Map(entities);

  // Collect live sensors by faction
  const blueSensors: Entity[] = [];
  const redSensors: Entity[] = [];
  for (const e of updated.values()) {
    if (e.state === 'DESTROYED' || !e.sensor) continue;
    if (e.flightState === 'PARKED') continue; // parked aircraft don't detect
    if (e.faction === 'BLUE') blueSensors.push(e);
    else redSensors.push(e);
  }

  // BLUE sensors detect RED entities
  for (const [id, entity] of updated) {
    if (entity.faction !== 'RED' || entity.state === 'DESTROYED' || entity.flightState === 'PARKED') continue;
    const detectedBy: EntityId[] = [];
    for (const sensor of blueSensors) {
      if (isInSensorCone(sensor, entity.position, entity)) {
        detectedBy.push(sensor.id);
      }
    }
    updated.set(id, { ...entity, isDetected: detectedBy.length > 0, detectedBy });
  }

  // RED sensors detect BLUE entities (for SAM targeting + RWR)
  for (const [id, entity] of updated) {
    if (entity.faction !== 'BLUE' || entity.state === 'DESTROYED' || entity.flightState === 'PARKED') continue;
    const detectedBy: EntityId[] = [];
    for (const sensor of redSensors) {
      if (isInSensorCone(sensor, entity.position, entity)) {
        detectedBy.push(sensor.id);
      }
    }
    updated.set(id, { ...entity, isDetected: detectedBy.length > 0, detectedBy });
  }

  return updated;
}
