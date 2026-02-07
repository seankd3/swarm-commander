import type { GameState, MissionResult } from './types';
import { tickTime } from './time';
import { runMovementSystem } from './systems/movement';
import { runDetectionSystem } from './systems/detection';
import { runContactsSystem } from './systems/contacts';
import { runCombatSystem } from './systems/combat';
import { runMissileLaunchSystem, runMissileFlightSystem } from './systems/missiles';
import { runFuelSystem, injectBingoRtb } from './systems/fuel';
import { runFlightOpsSystem } from './systems/flight-ops';
import { runTaskSystem } from './task-executor';
import { runFormationSystem } from './systems/formation';

/** Check win/lose conditions (data-driven from scenario objectives) */
function checkMissionResult(state: GameState): MissionResult {
  if (state.missionResult !== 'PENDING') {
    return state.missionResult;
  }

  // Check all objectives satisfied
  const allComplete = state.objectives.every((obj) => {
    if (obj.type === 'DESTROY') {
      // Find entity with this tag — must be DESTROYED
      for (const entity of state.entities.values()) {
        if (entity.tag === obj.entityTag) {
          return entity.state === 'DESTROYED';
        }
      }
      return true; // tag not found = already removed = objective met
    }
    return false;
  });

  if (allComplete && state.objectives.length > 0) return 'VICTORY';

  // Defeat conditions
  const defeatCond = state.defeatCondition;

  if (defeatCond === 'ALL_BLUE_DEAD' || defeatCond === 'BOTH') {
    let blueAlive = false;
    for (const entity of state.entities.values()) {
      if (entity.faction === 'BLUE' && entity.state !== 'DESTROYED') {
        blueAlive = true;
        break;
      }
    }
    if (!blueAlive) return 'DEFEAT';
  }

  if (defeatCond === 'TIME_EXPIRED' || defeatCond === 'BOTH') {
    if (state.time.elapsed >= state.time.missionDuration) return 'DEFEAT';
  }

  return 'PENDING';
}

/** Process one simulation tick */
export function tick(state: GameState, realDelta: number): GameState {
  if (state.missionResult !== 'PENDING') return state;

  const newTime = tickTime(state.time, realDelta);
  const gameDelta = newTime.elapsed - state.time.elapsed;

  if (gameDelta <= 0) return { ...state, time: newTime };

  // 1. Flight ops (state machine transitions: LAUNCHING→AIRBORNE, RECOVERING→PARKED)
  let entities = runFlightOpsSystem(state.entities, gameDelta, newTime.elapsed);

  // 2. Movement + sensor rotation
  entities = runMovementSystem(entities, gameDelta);

  // 3. Fuel burn (after movement, uses current speed)
  entities = runFuelSystem(entities, gameDelta);

  // 4. Combat (suicide strikes)
  entities = runCombatSystem(entities, gameDelta);

  // 5. Sensor detection
  entities = runDetectionSystem(entities);

  // 6. Shared contact picture
  const contacts = runContactsSystem(state.contacts, entities, newTime.elapsed);

  // 7. Missile launch (SAM engagement)
  const launchResult = runMissileLaunchSystem({ ...state, time: newTime, entities, contacts });
  entities = launchResult.entities;
  let missiles = launchResult.missiles;

  // 8. Active formation keeping (after movement, before missile resolution)
  entities = runFormationSystem(entities, state.tasks);

  // 9. Missile flight + hit resolution (all guidance types)
  const flightResult = runMissileFlightSystem(missiles, entities, contacts, gameDelta);
  missiles = flightResult.missiles;
  entities = flightResult.entities;

  let newState: GameState = {
    ...state,
    time: newTime,
    entities,
    contacts,
    missiles,
  };

  // 9. Bingo RTB injection (auto-injects RTB+LAND for fuel-critical aircraft)
  newState = injectBingoRtb(newState);

  // 10-11. Task system (entity-centric queue execution)
  newState = runTaskSystem(newState, gameDelta);

  return {
    ...newState,
    missionResult: checkMissionResult(newState),
  };
}
