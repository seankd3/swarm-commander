import type { GameState, Entity } from './types';
import { MPA_SPECS, MISSION_SPECS, PLAY_AREA } from './types';

/** Create the initial MPA entity */
function createMPA(): Entity {
  return {
    id: 'mpa-1',
    type: 'MPA',
    position: {
      lat: (PLAY_AREA.north + PLAY_AREA.south) / 2,
      lon: PLAY_AREA.west - 0.2, // start just west of play area
    },
    velocity: { heading: 90, speed: 0 },
    state: 'IDLE',
    fuel: MPA_SPECS.fuelDuration,
    maxSpeed: MPA_SPECS.maxSpeed,
    destination: null,
  };
}

/** Create the initial game state for Mission 1 */
export function createInitialState(): GameState {
  const mpa = createMPA();
  const entities = new Map<string, Entity>();
  entities.set(mpa.id, mpa);

  return {
    time: {
      elapsed: 0,
      missionDuration: MISSION_SPECS.duration,
      speed: 0, // start paused
      previousSpeed: 1,
    },
    entities,
  };
}
