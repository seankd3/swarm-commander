import { createInitialState } from './simulation/state';
import { tick, processCommand } from './simulation/game';
import { setSpeed, togglePause, formatTime } from './simulation/time';
import type { GameState, TimeSpeed } from './simulation/types';
import { createCamera, resizeCamera } from './renderer/camera';
import type { Camera } from './renderer/camera';
import { render } from './renderer/canvas-renderer';
import { createInputState, bindInputEvents } from './input/input-handler';

// --- Initialization ---

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Size canvas to window
function resizeCanvas(): void {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  camera = resizeCamera(camera, canvas.width, canvas.height);
}

// State
let gameState: GameState = createInitialState();
let camera: Camera = createCamera(window.innerWidth, window.innerHeight);

// Input
const inputState = createInputState(camera);
bindInputEvents(
  canvas,
  inputState,
  () => camera,
  (c: Camera) => { camera = c; },
);

// Click handler: move MPA to clicked position
inputState.onClick = (worldPos) => {
  gameState = processCommand(gameState, {
    type: 'MOVE',
    entityId: 'mpa-1',
    target: worldPos,
  });
};

// --- HUD Elements ---

const clockEl = document.getElementById('mission-clock')!;
const statusEl = document.getElementById('mpa-status')!;
const headingEl = document.getElementById('mpa-heading')!;
const speedEl = document.getElementById('mpa-speed')!;
const fuelEl = document.getElementById('mpa-fuel')!;
const positionEl = document.getElementById('mpa-position')!;

const btnPause = document.getElementById('btn-pause')!;
const btn1x = document.getElementById('btn-1x')!;
const btn5x = document.getElementById('btn-5x')!;
const btn20x = document.getElementById('btn-20x')!;

function updateHUD(): void {
  const { time, entities } = gameState;
  const mpa = entities.get('mpa-1');

  // Mission clock
  clockEl.textContent = `${formatTime(time.elapsed)} / ${formatTime(time.missionDuration)}`;

  // MPA info
  if (mpa) {
    statusEl.textContent = mpa.state;
    headingEl.textContent = `${Math.round(mpa.velocity.heading).toString().padStart(3, '0')}°`;
    const speedKts = (mpa.velocity.speed / 0.514444).toFixed(0);
    speedEl.textContent = `${speedKts} kts`;
    fuelEl.textContent = formatTime(mpa.fuel);
    positionEl.textContent = `${mpa.position.lat.toFixed(2)}°N ${mpa.position.lon.toFixed(2)}°E`;
  }

  // Time control buttons
  btnPause.classList.toggle('active', time.speed === 0);
  btn1x.classList.toggle('active', time.speed === 1);
  btn5x.classList.toggle('active', time.speed === 5);
  btn20x.classList.toggle('active', time.speed === 20);
}

// --- Time Control Buttons ---

function setGameSpeed(speed: TimeSpeed): void {
  gameState = { ...gameState, time: setSpeed(gameState.time, speed) };
}

btnPause.addEventListener('click', () => {
  gameState = { ...gameState, time: togglePause(gameState.time) };
});
btn1x.addEventListener('click', () => setGameSpeed(1));
btn5x.addEventListener('click', () => setGameSpeed(5));
btn20x.addEventListener('click', () => setGameSpeed(20));

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      gameState = { ...gameState, time: togglePause(gameState.time) };
      break;
    case 'Digit1':
      setGameSpeed(1);
      break;
    case 'Digit2':
      setGameSpeed(5);
      break;
    case 'Digit3':
      setGameSpeed(20);
      break;
  }
});

// --- Game Loop ---

let lastTimestamp = 0;

function gameLoop(timestamp: number): void {
  const realDelta = lastTimestamp === 0 ? 0 : (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  // Cap real delta to prevent huge jumps when tab is backgrounded
  const cappedDelta = Math.min(realDelta, 0.1);

  // Tick simulation
  gameState = tick(gameState, cappedDelta);

  // Render
  render(ctx, gameState, camera);

  // Update HUD
  updateHUD();

  requestAnimationFrame(gameLoop);
}

// --- Start ---

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
requestAnimationFrame(gameLoop);
