import type { Position } from './types';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const EARTH_RADIUS = 6371000; // meters

/** Haversine distance between two positions in meters */
export function distanceMeters(a: Position, b: Position): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLon = (b.lon - a.lon) * DEG_TO_RAD;
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS * Math.asin(Math.sqrt(h));
}

/** Bearing from position a to position b in degrees (0 = north, clockwise) */
export function bearingDegrees(from: Position, to: Position): number {
  const lat1 = from.lat * DEG_TO_RAD;
  const lat2 = to.lat * DEG_TO_RAD;
  const dLon = (to.lon - from.lon) * DEG_TO_RAD;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * RAD_TO_DEG) + 360) % 360;
}

/** Move a position along a heading by a distance in meters */
export function movePosition(pos: Position, heading: number, distanceM: number): Position {
  const lat1 = pos.lat * DEG_TO_RAD;
  const lon1 = pos.lon * DEG_TO_RAD;
  const brng = heading * DEG_TO_RAD;
  const d = distanceM / EARTH_RADIUS;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 = lon1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );

  return {
    lat: lat2 * RAD_TO_DEG,
    lon: lon2 * RAD_TO_DEG,
  };
}

/** Normalize heading to 0-360 range */
export function normalizeHeading(deg: number): number {
  return ((deg % 360) + 360) % 360;
}
