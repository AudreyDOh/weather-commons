import * as THREE from 'three';
import { TilesRenderer } from '3d-tiles-renderer/three';
import {
  DownloadPriorityQueue,
  LRUCache,
  PriorityQueue,
} from '3d-tiles-renderer/core';
import { EARTH_METRES } from './earth-geometry';
import {
  regionalTerrain,
  regionalElevation,
  type TerrainStatus,
} from './terrain-catalog';
import { publicUrl } from './public-url';

/** On-demand regional OGC 3D Tiles; this module is loaded only near its coverage. */
export function createTerrainTiles(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
) {
  const tiles = new TilesRenderer(publicUrl(regionalTerrain.tileset));
  const cache = new LRUCache();
  cache.minSize = 24;
  cache.maxSize = 48;
  cache.minBytesSize = 48 * 1024 ** 2;
  cache.maxBytesSize = 80 * 1024 ** 2;
  cache.unloadPriorityCallback = tiles.lruCache.unloadPriorityCallback;
  tiles.lruCache = cache;
  const download = new DownloadPriorityQueue();
  download.maxJobsPerOrigin = 4;
  download.priorityCallback = tiles.downloadQueue.priorityCallback;
  tiles.downloadQueue = download;
  const parse = new PriorityQueue();
  parse.maxJobs = 1;
  parse.priorityCallback = tiles.parseQueue.priorityCallback;
  tiles.parseQueue = parse;
  tiles.errorTarget = 12;
  tiles.loadAncestors = true;
  tiles.maxTilesProcessed = 40;
  tiles.setCamera(camera);
  // Source content: spherical ECEF metres (X Greenwich, Y east, Z north).
  // Shared Earth: normalized radius (X east, Y north, Z Greenwich).
  tiles.group.matrixAutoUpdate = false;
  tiles.group.matrix.set(
    0,
    1 / EARTH_METRES,
    0,
    0,
    0,
    0,
    1 / EARTH_METRES,
    0,
    1 / EARTH_METRES,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
  );
  tiles.group.updateMatrixWorld(true);
  scene.add(tiles.group);
  let loaded = 0,
    rootReady = false,
    alive = true,
    error = '',
    grid: Float32Array | null = null,
    wasActive = false;
  const controller = new AbortController();
  fetch(publicUrl(regionalTerrain.grid), { signal: controller.signal })
    .then((r) => {
      if (!r.ok) throw Error();
      return r.arrayBuffer();
    })
    .then((b) => {
      if (alive) {
        if (b.byteLength !== 513 * 513 * 4) throw Error();
        grid = new Float32Array(b);
      }
    })
    .catch(() => {
      if (alive) error = 'Terrain height lookup unavailable';
    });
  tiles.addEventListener('load-model', ({ scene: model, url }) => {
    loaded++;
    if (url.endsWith('/0-0-0.glb')) rootReady = true;
    model.traverse((o) => {
      o.userData.regionalTerrain = true;
    });
  });
  tiles.addEventListener('dispose-model', ({ tile }) => {
    loaded = Math.max(0, loaded - 1);
    if (tile === tiles.root) rootReady = false;
  });
  tiles.addEventListener('load-error', () => {
    error =
      'Detail unavailable; showing available tiles or the global overview.';
  });
  return {
    group: tiles.group,
    elevation: (lon: number, lat: number) => regionalElevation(grid, lon, lat),
    get ready() {
      return rootReady && tiles.visibleTiles.size > 0;
    },
    update(active: boolean): TerrainStatus {
      if (active && !wasActive && error) {
        error = '';
        tiles.resetFailedTiles();
      }
      wasActive = active;
      tiles.group.visible = active;
      if (active) {
        tiles.setResolutionFromRenderer(camera, renderer);
        tiles.group.updateMatrixWorld(true);
        tiles.update();
      }
      let level = 0;
      for (const tile of tiles.visibleTiles)
        level = Math.max(
          level,
          Number((tile as { extras?: { level?: number } }).extras?.level ?? 0),
        );
      return {
        active,
        loaded,
        visible: active ? tiles.visibleTiles.size : 0,
        level,
        loading: active && tiles.loadProgress < 1,
        error,
      };
    },
    dispose() {
      alive = false;
      controller.abort();
      scene.remove(tiles.group);
      tiles.dispose();
    },
  };
}
