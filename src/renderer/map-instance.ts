// --- MapLibre GL JS Singleton ---
// Single source of truth for the map instance.

import maplibregl from 'maplibre-gl';

let map: maplibregl.Map | null = null;

export interface MapConfig {
  center: [number, number]; // [lon, lat]
  zoom: number;             // MapLibre zoom level (0-22)
  maxBounds?: [[number, number], [number, number]]; // [[west, south], [east, north]]
}

export function initMap(container: string | HTMLElement, config: MapConfig): maplibregl.Map {
  if (map) {
    map.remove();
    map = null;
  }

  map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {
        'carto-dark': {
          type: 'raster',
          tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
          tileSize: 256,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        },
      },
      layers: [
        {
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    center: config.center,
    zoom: config.zoom,
    maxBounds: config.maxBounds,
    attributionControl: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
  });

  // Disable left-drag pan — we use middle-click pan instead
  map.dragPan.disable();

  // Disable rotation entirely
  map.touchZoomRotate.disableRotation();

  return map;
}

export function getMap(): maplibregl.Map {
  if (!map) throw new Error('Map not initialized — call initMap() first');
  return map;
}

export function hasMap(): boolean {
  return map !== null;
}

export function destroyMap(): void {
  if (map) {
    map.remove();
    map = null;
  }
}
