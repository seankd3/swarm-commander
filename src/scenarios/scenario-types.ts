// --- Scenario Definition Types ---
// Static data describing a mission. No runtime state.

import type { Faction, FlightState, Position } from '../simulation/types';

/** A single mission objective */
export interface ObjectiveDef {
  entityTag: string;         // matches Entity tag field (e.g. 'obj-radar-1')
  label: string;             // HUD text: 'RADAR Station Alpha'
  type: 'DESTROY';           // future: 'PROTECT', 'ESCORT', etc.
}

/** How an entity spawns into the scenario */
export interface EntitySpawn {
  platformId: string;
  faction: Faction;
  position: { lat: number; lon: number };
  heading?: number;
  id?: string;               // explicit entity ID
  tag?: string;              // for objective matching
  homeBaseId?: string;       // for aircraft starting PARKED
  flightState?: FlightState; // override default (e.g. 'PARKED')
}

/** Geographic bounds for a play area */
export interface PlayAreaBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

// --- Intel Briefing System ---

/** Accuracy tier for an intel marker */
export type IntelAccuracy = 'CONFIRMED' | 'ESTIMATED' | 'SUSPECTED';

/** A spatial intel marker — something we know (or think we know) about the battlespace */
export interface IntelMarker {
  label: string;                   // e.g. 'SA-15 SAM Battery'
  position: Position;              // center of marker
  accuracy: IntelAccuracy;         // how sure we are
  radiusMeters: number;            // uncertainty zone (0 for CONFIRMED = exact)
  threatType?: string;             // e.g. 'SAM', 'RADAR', 'COMMAND', 'EW'
  notes?: string;                  // extra detail shown on hover/briefing
}

/** An approach corridor — suggested ingress/egress route */
export interface Corridor {
  name: string;                    // e.g. 'Western Low Approach'
  waypoints: Position[];           // ordered lat/lon path
  notes: string;                   // description of why this corridor is viable
}

/** Known enemy force entry for the OPORD */
export interface EnemyForceEntry {
  type: string;                    // e.g. 'SA-15 Heavy SAM', 'Ground Radar'
  count: string;                   // e.g. '1x confirmed', '2-3 estimated'
  capability: string;              // e.g. 'Engages aircraft within 10km, radar-guided'
  notes?: string;
}

/** Friendly force entry for the OPORD */
export interface FriendlyForceEntry {
  type: string;                    // e.g. 'MQ-9 Specter ISR'
  count: number;
  role: string;                    // e.g. 'ISR / Target Designation'
}

/** Structured OPORD briefing — the full intel picture before a mission */
export interface IntelBriefing {
  // --- Narrative OPORD sections ---
  situation: string;               // operational context, what's happening
  mission: string;                 // commander's intent — what we need to achieve
  threatAssessment: string;        // overall threat level and summary

  // --- Structured force data ---
  enemyForces: EnemyForceEntry[];
  friendlyForces: FriendlyForceEntry[];

  // --- Spatial intel ---
  markers: IntelMarker[];          // all known/estimated threat positions
  corridors: Corridor[];           // suggested approach routes

  // --- Unconfirmed reports ---
  unconfirmedReports: string[];    // text descriptions of rumors/SIGINT
}

/** Complete scenario definition */
export interface ScenarioDef {
  id: string;                // unique key: 'opening-strike'
  name: string;              // display: 'Opening Strike'
  description: string;       // mission briefing
  duration: number;          // seconds

  // Map configuration
  mapCenter: { lat: number; lon: number };
  mapZoom: number;           // MapLibre zoom level (0-22)
  maxBounds?: PlayAreaBounds;

  entities: EntitySpawn[];

  objectives: ObjectiveDef[];
  defeatCondition: 'ALL_BLUE_DEAD' | 'TIME_EXPIRED' | 'BOTH';

  // Intel briefing (optional — scenarios without it skip briefing screen)
  intel?: IntelBriefing;

  victoryText: string;
  defeatText: string;
}
