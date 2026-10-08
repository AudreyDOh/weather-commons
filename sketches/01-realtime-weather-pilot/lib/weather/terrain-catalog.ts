export const regionalTerrain = {
  title: 'Mount Rainier / USGS 3DEP + NAIP',
  bounds: [-121.98, 46.72, -121.55, 47.0] as const,
  tileset: '/data/archive/rainier/tileset.json',
  grid: '/data/archive/rainier/elevation.f32',
  manifest: '/data/archive/rainier/manifest.json',
  gridSize: 513,
};
export type TerrainStatus = {
  active: boolean;
  loaded: number;
  visible: number;
  level: number;
  loading: boolean;
  error: string;
};
export const emptyTerrainStatus: TerrainStatus = {
  active: false,
  loaded: 0,
  visible: 0,
  level: 0,
  loading: false,
  error: '',
};
export function inTerrainRegion(lon: number, lat: number, margin = 0) {
  const [w, s, e, n] = regionalTerrain.bounds;
  const l = ((((lon + 180) % 360) + 360) % 360) - 180;
  return (
    l >= w - margin && l <= e + margin && lat >= s - margin && lat <= n + margin
  );
}
export function regionalElevation(
  grid: Float32Array | null,
  lon: number,
  lat: number,
) {
  if (!grid || !inTerrainRegion(lon, lat)) return null;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  const [w, s, e, n] = regionalTerrain.bounds,
    z = regionalTerrain.gridSize;
  const x = Math.max(0, Math.min(z - 1, ((lon - w) / (e - w)) * z - 0.5)),
    y = Math.max(0, Math.min(z - 1, ((n - lat) / (n - s)) * z - 0.5));
  const i = Math.floor(x),
    j = Math.floor(y),
    dx = x - i,
    dy = y - j;
  const v = (a: number, b: number) =>
    grid[Math.min(z - 1, b) * z + Math.min(z - 1, a)];
  return (
    (v(i, j) * (1 - dx) + v(i + 1, j) * dx) * (1 - dy) +
    (v(i, j + 1) * (1 - dx) + v(i + 1, j + 1) * dx) * dy
  );
}
