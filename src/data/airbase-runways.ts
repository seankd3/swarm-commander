// --- Airbase Runway Geometry ---
// Real-world runway positions keyed by scenario base entity ID.
// Returns null for bases without data → graceful fallback to current behavior.

import type { Position } from '../simulation/types';
import { bearingDegrees, distanceMeters, movePosition, normalizeHeading } from '../simulation/geo';

export interface RunwayDef {
  id: string;                    // e.g. 'RWY-13R/31L'
  name: string;                  // e.g. '13R/31L'
  thresholdA: Position;          // one end of runway (lat/lon)
  thresholdB: Position;          // other end (lat/lon)
  preferredDepartureEnd: 'A' | 'B';  // which end aircraft depart FROM (roll toward opposite end)
}

// --- Al Dhafra Air Base (OMAM) ---
// Runway 13R/31L — primary runway, hard surface, 3661m x 46m
// Threshold coords from SkyVector (converted from DMS to decimal degrees)

const AL_DHAFRA_RUNWAYS: RunwayDef[] = [
  {
    id: 'RWY-13R/31L',
    name: '13R/31L',
    thresholdA: { lat: 24.24083, lon: 54.53667 },  // 13R end (NW)
    thresholdB: { lat: 24.22100, lon: 54.56550 },   // 31L end (SE)
    preferredDepartureEnd: 'A',  // depart from 13R threshold, roll toward 31L (heading ~130°)
  },
];

// --- Registry: base entity ID → runway defs ---

const RUNWAY_REGISTRY: Record<string, RunwayDef[]> = {
  'outpost-base': AL_DHAFRA_RUNWAYS,
};

// --- Public API ---

/** Get runway definitions for a base. Returns null if no runway data exists. */
export function getRunwaysForBase(baseEntityId: string): RunwayDef[] | null {
  return RUNWAY_REGISTRY[baseEntityId] ?? null;
}

/** Get the primary runway for a base (first defined). Returns null if none. */
export function getPrimaryRunway(baseEntityId: string): RunwayDef | null {
  const runways = getRunwaysForBase(baseEntityId);
  return runways ? runways[0] : null;
}

/** Get the departure threshold (where aircraft start their roll). */
export function getDepartureThreshold(runway: RunwayDef): Position {
  return runway.preferredDepartureEnd === 'A' ? runway.thresholdA : runway.thresholdB;
}

/** Get the arrival threshold (where aircraft touch down on landing). */
export function getArrivalThreshold(runway: RunwayDef): Position {
  // Land toward the departure end — opposite of departure direction
  return runway.preferredDepartureEnd === 'A' ? runway.thresholdB : runway.thresholdA;
}

/** Departure heading (from departure threshold toward opposite end). */
export function getDepartureHeading(runway: RunwayDef): number {
  const from = getDepartureThreshold(runway);
  const to = runway.preferredDepartureEnd === 'A' ? runway.thresholdB : runway.thresholdA;
  return bearingDegrees(from, to);
}

/** Landing heading (from approach toward arrival threshold, i.e. opposite of departure). */
export function getLandingHeading(runway: RunwayDef): number {
  return normalizeHeading(getDepartureHeading(runway) + 180);
}

/** Runway length in meters. */
export function runwayLength(runway: RunwayDef): number {
  return distanceMeters(runway.thresholdA, runway.thresholdB);
}

/** Get the approach point — a position extended out from the arrival threshold on the approach path. */
export function getApproachPoint(runway: RunwayDef, distanceFromThreshold: number): Position {
  const arrivalThreshold = getArrivalThreshold(runway);
  const landingHdg = getLandingHeading(runway);
  // Approach point is BEHIND the arrival threshold, along the landing heading (extended out)
  return movePosition(arrivalThreshold, normalizeHeading(landingHdg + 180), distanceFromThreshold);
}
