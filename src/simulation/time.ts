import type { TimeState, TimeSpeed } from './types';

/** Advance the game clock by real-time delta */
export function tickTime(time: TimeState, realDeltaSeconds: number): TimeState {
  if (time.speed === 0) return time;
  const gameDelta = realDeltaSeconds * time.speed;
  return {
    ...time,
    elapsed: Math.min(time.elapsed + gameDelta, time.missionDuration),
  };
}

/** Set game speed */
export function setSpeed(time: TimeState, speed: TimeSpeed): TimeState {
  return {
    ...time,
    speed,
    previousSpeed: time.speed === 0 ? time.previousSpeed : time.speed,
  };
}

/** Toggle pause (pause ↔ previous speed) */
export function togglePause(time: TimeState): TimeState {
  if (time.speed === 0) {
    // Unpause: restore previous speed (default 1 if no previous)
    return { ...time, speed: time.previousSpeed || 1 };
  }
  // Pause: save current speed
  return { ...time, previousSpeed: time.speed, speed: 0 };
}

/** Format seconds as HH:MM:SS */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
