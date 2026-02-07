// --- Input Handler ---
// Overlay canvas captures all mouse events.
// Middle-click + scroll → MapLibre (pan/zoom).
// Left/right click → game (selection, commands).
// All callback coordinates are canvas-relative (matching map.project() output).

import { getMap } from '../renderer/map-instance';

/** Callbacks for input events — main.ts handles all game logic */
export interface InputCallbacks {
  onLeftClick: (screenX: number, screenY: number, ctrlKey: boolean) => void;
  onBoxSelect: (startX: number, startY: number, endX: number, endY: number, ctrlKey: boolean) => void;
  onRightClick: (screenX: number, screenY: number, shiftKey: boolean) => void;
  onSelectionBoxUpdate: (startX: number, startY: number, endX: number, endY: number) => void;
  onSelectionBoxClear: () => void;
}

export interface InputState {
  callbacks: InputCallbacks;
  isPanning: boolean;
  isBoxSelecting: boolean;
  dragStartX: number;
  dragStartY: number;
  lastMouseX: number;
  lastMouseY: number;
}

const CLICK_THRESHOLD = 5;

export function createInputState(callbacks: InputCallbacks): InputState {
  return {
    callbacks,
    isPanning: false,
    isBoxSelecting: false,
    dragStartX: 0,
    dragStartY: 0,
    lastMouseX: 0,
    lastMouseY: 0,
  };
}

/** Bind all input event listeners to the overlay canvas */
export function bindInputEvents(
  canvas: HTMLCanvasElement,
  inputState: InputState,
): void {
  /** Convert window clientX/Y to canvas-relative coordinates */
  function toCanvas(clientX: number, clientY: number): [number, number] {
    const rect = canvas.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  }

  // Mouse down
  canvas.addEventListener('mousedown', (e) => {
    const [cx, cy] = toCanvas(e.clientX, e.clientY);
    if (e.button === 1) {
      // Middle click: start map pan (uses window-relative deltas, not positions)
      inputState.isPanning = true;
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
      e.preventDefault();
    } else if (e.button === 0) {
      // Left click: start potential click or box select
      inputState.dragStartX = cx;
      inputState.dragStartY = cy;
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
    } else if (e.button === 2) {
      // Right click: record for command
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
    }
  });

  // Mouse move
  canvas.addEventListener('mousemove', (e) => {
    if (inputState.isPanning) {
      // Panning uses window-relative deltas (unaffected by canvas offset)
      const dx = e.clientX - inputState.lastMouseX;
      const dy = e.clientY - inputState.lastMouseY;
      try {
        const map = getMap();
        map.panBy([-dx, -dy], { animate: false });
      } catch {
        // Map not ready
      }
      inputState.lastMouseX = e.clientX;
      inputState.lastMouseY = e.clientY;
    } else if (e.buttons === 1) {
      // Left button held — check if dragging far enough for box select
      const [cx, cy] = toCanvas(e.clientX, e.clientY);
      const dx = Math.abs(cx - inputState.dragStartX);
      const dy = Math.abs(cy - inputState.dragStartY);
      if (dx > CLICK_THRESHOLD || dy > CLICK_THRESHOLD) {
        inputState.isBoxSelecting = true;
        inputState.callbacks.onSelectionBoxUpdate(
          inputState.dragStartX, inputState.dragStartY,
          cx, cy,
        );
      }
    }
  });

  // Mouse up
  canvas.addEventListener('mouseup', (e) => {
    const [cx, cy] = toCanvas(e.clientX, e.clientY);
    if (e.button === 1) {
      inputState.isPanning = false;
    } else if (e.button === 0) {
      if (inputState.isBoxSelecting) {
        // Finish box select
        inputState.callbacks.onBoxSelect(
          inputState.dragStartX, inputState.dragStartY,
          cx, cy,
          e.ctrlKey || e.metaKey,
        );
        inputState.callbacks.onSelectionBoxClear();
        inputState.isBoxSelecting = false;
      } else {
        // Single click
        inputState.callbacks.onLeftClick(cx, cy, e.ctrlKey || e.metaKey);
      }
    } else if (e.button === 2) {
      // Right click: issue command if didn't drag
      const dx = Math.abs(e.clientX - inputState.lastMouseX);
      const dy = Math.abs(e.clientY - inputState.lastMouseY);
      if (dx < CLICK_THRESHOLD && dy < CLICK_THRESHOLD) {
        inputState.callbacks.onRightClick(cx, cy, e.shiftKey);
      }
    }
  });

  // Scroll: forward zoom to MapLibre
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    try {
      const map = getMap();
      const container = map.getCanvasContainer();
      // Clone and dispatch to MapLibre's canvas container where scrollZoom listens
      container.dispatchEvent(new WheelEvent('wheel', {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        bubbles: true,
      }));
    } catch {
      // Map not ready
    }
  }, { passive: false });

  // Prevent context menu
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}
