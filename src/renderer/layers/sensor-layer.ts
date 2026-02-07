// --- Sensor Layer ---
// Sensor cones, threat rings. Capability-driven.

import type { GameState, Entity } from '../../simulation/types';
import { getPlatform } from '../../platforms/platform-registry';
import type { Camera } from '../camera';
import { worldToScreen } from '../camera';
import { COLORS } from '../colors';
import { metersToPixels } from '../render-utils';

export function drawSensorCoverages(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const entity of state.entities.values()) {
    if (entity.state === 'DESTROYED' || !entity.sensor) continue;
    if (entity.faction === 'RED' && !entity.isDetected) continue;
    if (entity.radarMode === 'PASSIVE') continue;
    drawSensorCone(ctx, entity, camera);
  }
}

function drawSensorCone(ctx: CanvasRenderingContext2D, entity: Entity, camera: Camera): void {
  if (!entity.sensor) return;

  const screen = worldToScreen(camera, entity.position);
  const rangePixels = metersToPixels(camera, entity.sensor.range);
  const fov = entity.sensor.fieldOfView;
  const sensorAngle = entity.heading + entity.sensor.currentAngle;

  if (fov >= 360) {
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, rangePixels, 0, Math.PI * 2);
    ctx.fillStyle = entity.faction === 'BLUE' ? COLORS.blueSensor : COLORS.redSensor;
    ctx.fill();
    ctx.strokeStyle = entity.faction === 'BLUE' ? COLORS.blueSensorBorder : COLORS.redSensorBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    return;
  }

  const startAngle = ((sensorAngle - fov / 2 - 90) * Math.PI) / 180;
  const endAngle = ((sensorAngle + fov / 2 - 90) * Math.PI) / 180;

  ctx.beginPath();
  ctx.moveTo(screen.x, screen.y);
  ctx.arc(screen.x, screen.y, rangePixels, startAngle, endAngle);
  ctx.closePath();

  if (entity.faction === 'RED' && entity.sensor && entity.sensor.rotationSpeed > 0) {
    ctx.fillStyle = COLORS.redSensorSweep;
  } else {
    ctx.fillStyle = entity.faction === 'BLUE' ? COLORS.blueSensor : COLORS.redSensor;
  }
  ctx.fill();

  ctx.strokeStyle = entity.faction === 'BLUE' ? COLORS.blueSensorBorder : COLORS.redSensorBorder;
  ctx.lineWidth = 1;
  ctx.stroke();
}

export function drawThreatRings(ctx: CanvasRenderingContext2D, state: GameState, camera: Camera): void {
  for (const entity of state.entities.values()) {
    if (entity.faction !== 'RED' || entity.state === 'DESTROYED') continue;
    if (!entity.isDetected) continue;

    const platform = getPlatform(entity.platformId);

    if (platform.weapon) {
      const screen = worldToScreen(camera, entity.position);
      const rangePixels = metersToPixels(camera, platform.weapon.range);

      ctx.beginPath();
      ctx.arc(screen.x, screen.y, rangePixels, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.samThreatRing;
      ctx.fill();
      ctx.strokeStyle = COLORS.samThreatBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (platform.sensor && !platform.weapon) {
      const screen = worldToScreen(camera, entity.position);
      const rangePixels = metersToPixels(camera, platform.sensor.range);

      ctx.beginPath();
      ctx.arc(screen.x, screen.y, rangePixels, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.radarCoverage;
      ctx.fill();
      ctx.strokeStyle = COLORS.radarCoverageBorder;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
