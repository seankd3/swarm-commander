/**
 * Color palette — Gotham-inspired C2 aesthetic
 * Based on Palantir Blueprint dark theme: 215° blue-tinted grays
 */

export const COLORS = {
  // Background hierarchy (Gotham dark theme)
  background: '#111418',       // deepest — app shell
  panelBg: '#1C2127',          // primary dark background
  panelElevated: '#252A31',    // elevated surfaces
  panelCard: '#2F343C',        // card backgrounds
  border: '#383E47',           // borders, dividers
  borderHover: '#404854',      // hover states

  // Play area
  playAreaFill: 'rgba(37, 42, 49, 0.5)',
  playAreaBorder: '#383E47',

  // Grid
  gridLine: 'rgba(56, 62, 71, 0.4)',
  gridLabel: 'rgba(95, 107, 124, 0.5)',

  // Text hierarchy (Gotham)
  textMuted: '#5F6B7C',
  textSecondary: '#8F99A8',
  textBody: '#ABB3BF',
  textPrimary: '#C5CBD3',

  // Intent: Primary/Info (Blue) — friendly forces, selections, links
  blueUnit: '#4C90F0',
  blueUnitBright: '#8ABBFF',
  bluePrimary: '#2D72D2',
  blueSensor: 'rgba(76, 144, 240, 0.10)',
  blueSensorBorder: 'rgba(76, 144, 240, 0.25)',
  blueDestination: 'rgba(76, 144, 240, 0.25)',
  blueDestLine: 'rgba(76, 144, 240, 0.15)',
  blueSelection: '#4C90F0',

  // Intent: Danger (Red) — hostile forces, threats
  redUnit: '#E76A6E',
  redUnitDark: '#8E292C',
  redSensor: 'rgba(231, 106, 110, 0.06)',
  redSensorSweep: 'rgba(231, 106, 110, 0.12)',
  redSensorBorder: 'rgba(231, 106, 110, 0.20)',

  // Intent: Warning (Orange) — attack drones, caution
  hornetBody: '#EC9A3C',
  hornetGlow: 'rgba(236, 154, 60, 0.4)',

  // Fury CCA (SEAD hunter)
  furyBody: '#FF6B35',
  furyGlow: 'rgba(255, 107, 53, 0.4)',

  // Stealth Bomber
  bomberBody: '#7B68EE',
  bomberGlow: 'rgba(123, 104, 238, 0.4)',

  // Blue missiles (cruise missiles, ARMs)
  blueMissileBody: '#4C90F0',
  blueMissileTrail: 'rgba(76, 144, 240, 0.4)',

  // Intent: Success (Green) — victory, friendly status
  victory: '#32A467',

  // Defeat
  defeat: '#E76A6E',

  // Destroyed
  destroyed: '#404854',

  // Selection
  selectionBox: 'rgba(76, 144, 240, 0.15)',
  selectionBoxBorder: 'rgba(76, 144, 240, 0.6)',

  // Fog of war — unknown contacts
  unknownContact: '#5F6B7C',
  detectedFlash: 'rgba(231, 106, 110, 0.6)',

  // Contacts (shared COP)
  contactLive: '#E76A6E',
  contactStale: '#5F6B7C',
  contactRing: 'rgba(231, 106, 110, 0.3)',

  // Threat rings
  samThreatRing: 'rgba(231, 106, 110, 0.08)',
  samThreatBorder: 'rgba(231, 106, 110, 0.25)',
  radarCoverage: 'rgba(231, 106, 110, 0.04)',
  radarCoverageBorder: 'rgba(231, 106, 110, 0.12)',

  // Missiles
  missileBody: '#ff6666',
  missileTrail: 'rgba(255, 102, 102, 0.4)',

  // Task areas
  reconArea: 'rgba(76, 144, 240, 0.06)',
  reconAreaBorder: 'rgba(76, 144, 240, 0.3)',
  patrolArea: 'rgba(50, 164, 103, 0.06)',
  patrolAreaBorder: 'rgba(50, 164, 103, 0.3)',

  // ROE-colored task areas
  roeHoldArea: 'rgba(95, 107, 124, 0.06)',
  roeHoldBorder: 'rgba(95, 107, 124, 0.25)',
  roeTightArea: 'rgba(236, 154, 60, 0.06)',
  roeTightBorder: 'rgba(236, 154, 60, 0.25)',
  roeFreeArea: 'rgba(231, 106, 110, 0.06)',
  roeFreeBorder: 'rgba(231, 106, 110, 0.25)',

  // Watch area (STRIKE_ON_DETECT)
  watchArea: 'rgba(236, 154, 60, 0.06)',
  watchAreaBorder: 'rgba(236, 154, 60, 0.3)',

  // RWR warning
  rwrWarning: 'rgba(236, 154, 60, 0.8)',

  // Terrain
  islandFill: '#1A2030',
  islandBorder: '#2A3548',
  islandHighlight: '#222C3A',
  reefFill: 'rgba(30, 55, 70, 0.4)',
  reefBorder: 'rgba(40, 70, 90, 0.5)',
  shoalFill: 'rgba(20, 40, 55, 0.25)',
  shoalBorder: 'rgba(30, 55, 75, 0.3)',
  coastGlow: 'rgba(60, 90, 120, 0.15)',
} as const;
