// --- Camera Adapter ---
// Bridges the game's Camera interface to MapLibre GL JS.
// All downstream code continues to use worldToScreen/screenToWorld unchanged.

import type { Position } from '../simulation/types';
import { getMap, hasMap } from './map-instance';

/** Camera state — controls what portion of the world is visible */
export interface Camera {
  // Center of the viewport in lat/lon
  centerLat: number;
  centerLon: number;
  // Zoom level: pixels per degree of longitude (derived from MapLibre)
  zoom: number;
  // Viewport size in pixels
  viewportWidth: number;
  viewportHeight: number;
}

/** Sync Camera snapshot from current MapLibre map state. Called once per frame. */
export function syncCamera(viewportWidth: number, viewportHeight: number): Camera {
  const map = getMap();
  const center = map.getCenter();

  // Derive pixels-per-degree by projecting two points 1° apart
  const p1 = map.project([center.lng, center.lat]);
  const p2 = map.project([center.lng + 1, center.lat]);
  const pixelsPerDegree = Math.abs(p2.x - p1.x);

  return {
    centerLat: center.lat,
    centerLon: center.lng,
    zoom: pixelsPerDegree,
    viewportWidth,
    viewportHeight,
  };
}

/** Create initial camera — requires map to be initialized */
export function createCamera(viewportWidth: number, viewportHeight: number): Camera {
  if (!hasMap()) {
    // Fallback for pre-map state (mission select screen)
    return {
      centerLat: 0,
      centerLon: 0,
      zoom: 1000,
      viewportWidth,
      viewportHeight,
    };
  }
  return syncCamera(viewportWidth, viewportHeight);
}

/** Convert a world lat/lon to screen pixel coordinates */
export function worldToScreen(camera: Camera, pos: Position): { x: number; y: number } {
  if (!hasMap()) {
    // Fallback equirectangular projection when map not ready
    const x = (pos.lon - camera.centerLon) * camera.zoom + camera.viewportWidth / 2;
    const y = (camera.centerLat - pos.lat) * camera.zoom + camera.viewportHeight / 2;
    return { x, y };
  }
  const map = getMap();
  const point = map.project([pos.lon, pos.lat]);
  return { x: point.x, y: point.y };
}

/** Convert screen pixel coordinates to world lat/lon.
 * Expects canvas-relative coordinates (matching map.project() output). */
export function screenToWorld(_camera: Camera, screenX: number, screenY: number): Position {
  if (!hasMap()) {
    return { lat: 0, lon: 0 };
  }
  const map = getMap();
  const lngLat = map.unproject([screenX, screenY]);
  return { lat: lngLat.lat, lon: lngLat.lng };
}

/** Pan the camera by screen pixel delta — no-op, MapLibre handles pan */
export function panCamera(camera: Camera, _dx: number, _dy: number): Camera {
  return camera;
}

/** Zoom the camera around a screen point — no-op, MapLibre handles zoom */
export function zoomCamera(camera: Camera, _screenX: number, _screenY: number, _zoomIn: boolean): Camera {
  return camera;
}

/** Resize the camera viewport */
export function resizeCamera(camera: Camera, width: number, height: number): Camera {
  if (hasMap()) {
    getMap().resize();
    return syncCamera(width, height);
  }
  return { ...camera, viewportWidth: width, viewportHeight: height };
}
