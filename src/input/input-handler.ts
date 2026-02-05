import type { Camera } from '../renderer/camera';
import { panCamera, zoomCamera, screenToWorld } from '../renderer/camera';
import type { Position } from '../simulation/types';

export interface InputState {
  camera: Camera;
  isPanning: boolean;
  lastMouseX: number;
  lastMouseY: number;
  onClick: ((worldPos: Position) => void) | null;
}

/** Create input state */
export function createInputState(camera: Camera): InputState {
  return {
    camera,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,
    onClick: null,
  };
}

/** Bind all input event listeners to the canvas */
export function bindInputEvents(
  canvas: HTMLCanvasElement,
  inputState: InputState,
  getCamera: () => Camera,
  setCamera: (c: Camera) => void,
): void {
  // Mouse down: start pan (middle/right button) or handle click (left)
  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or right click: start panning
      inputState.isPanning = true;
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click: record position for potential click
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
    }
  });

  // Mouse move: pan if dragging
  canvas.addEventListener('mousemove', (e) => {
    if (inputState.isPanning) {
      const dx = e.clientX - inputState.lastMouseX;
      const dy = e.clientY - inputState.lastMouseY;
      setCamera(panCamera(getCamera(), dx, dy));
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
    }
  });

  // Mouse up: stop panning or trigger click
  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 1 || e.button === 2) {
      inputState.isPanning = false;
    } else if (e.button === 0) {
      // Left click: if mouse didn't move much, treat as click
      const dx = Math.abs(e.clientX - inputState.lastMouseX);
      const dy = Math.abs(e.clientY - inputState.lastMouseY);
      if (dx < 5 && dy < 5 && inputState.onClick) {
        const worldPos = screenToWorld(getCamera(), e.clientX, e.clientY);
        inputState.onClick(worldPos);
      }
    }
  });

  // Scroll: zoom
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIn = e.deltaY < 0;
    setCamera(zoomCamera(getCamera(), e.clientX, e.clientY, zoomIn));
  }, { passive: false });

  // Prevent context menu on right-click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
