import type { GameState, Command } from './types';
import { tickTime } from './time';
import { updateEntities, applyCommand } from './entities';

/** Process one simulation tick */
export function tick(state: GameState, realDelta: number): GameState {
  const newTime = tickTime(state.time, realDelta);
  const gameDelta = (newTime.elapsed - state.time.elapsed);

  if (gameDelta <= 0) return { ...state, time: newTime };

  return {
    time: newTime,
    entities: updateEntities(state.entities, gameDelta),
  };
}

/** Process a player command */
export function processCommand(state: GameState, command: Command): GameState {
  const entity = state.entities.get(command.entityId);
  if (!entity) return state;

  const updated = applyCommand(entity, command);
  const newEntities = new Map(state.entities);
  newEntities.set(entity.id, updated);

  return { ...state, entities: newEntities };
}
