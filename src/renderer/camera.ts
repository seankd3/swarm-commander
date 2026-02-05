import type { Position } from '../simulation/types';
import { PLAY_AREA } from '../simulation/types';

/** Camera state — controls what portion of the world is visible */
export interface Camera {
  // Center of the viewport in lat/lon
  centerLat: number;
  centerLon: number;
  // Zoom level: pixels per degree of longitude
  zoom: number;
  // Viewport size in pixels
  viewportWidth: number;
  viewportHeight: number;
}

const MIN_ZOOM = 100; // zoomed out
const MAX_ZOOM = 20000; // zoomed in
const ZOOM_FACTOR = 1.15;

/** Create initial camera centered on play area */
export function createCamera(viewportWidth: number, viewportHeight: number): Camera {
  const centerLat = (PLAY_AREA.north + PLAY_AREA.south) / 2;
  const centerLon = (PLAY_AREA.east + PLAY_AREA.west) / 2;

  // Fit the play area horizontally with some padding
  const lonSpan = PLAY_AREA.east - PLAY_AREA.west;
  const zoom = (viewportWidth * 0.8) / lonSpan;

  return { centerLat, centerLon, zoom, viewportWidth, viewportHeight };
}

/** Convert a world lat/lon to screen pixel coordinates */
export function worldToScreen(camera: Camera, pos: Position): { x: number; y: number } {
  // Equirectangular projection: x = lon, y = -lat (screen y is inverted)
  const x = (pos.lon - camera.centerLon) * camera.zoom + camera.viewportWidth / 2;
  const y = (camera.centerLat - pos.lat) * camera.zoom + camera.viewportHeight / 2;
  return { x, y };
}

/** Convert screen pixel coordinates to world lat/lon */
export function screenToWorld(camera: Camera, screenX: number, screenY: number): Position {
  const lon = (screenX - camera.viewportWidth / 2) / camera.zoom + camera.centerLon;
  const lat = camera.centerLat - (screenY - camera.viewportHeight / 2) / camera.zoom;
  return { lat, lon };
}

/** Pan the camera by screen pixel delta */
export function panCamera(camera: Camera, dx: number, dy: number): Camera {
  return {
    ...camera,
    centerLon: camera.centerLon - dx / camera.zoom,
    centerLat: camera.centerLat + dy / camera.zoom,
  };
}

/** Zoom the camera around a screen point */
export function zoomCamera(camera: Camera, screenX: number, screenY: number, zoomIn: boolean): Camera {
  const factor = zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
  const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, camera.zoom * factor));

  // Zoom toward the mouse position
  const worldBefore = screenToWorld(camera, screenX, screenY);
  const updatedCamera = { ...camera, zoom: newZoom };
  const worldAfter = screenToWorld(updatedCamera, screenX, screenY);

  return {
    ...updatedCamera,
    centerLon: updatedCamera.centerLon + (worldBefore.lon - worldAfter.lon),
    centerLat: updatedCamera.centerLat + (worldBefore.lat - worldAfter.lat),
  };
}

/** Resize the camera viewport */
export function resizeCamera(camera: Camera, width: number, height: number): Camera {
  return { ...camera, viewportWidth: width, viewportHeight: height };
}
