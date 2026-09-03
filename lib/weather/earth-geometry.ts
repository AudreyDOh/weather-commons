import * as THREE from 'three';

export const EARTH_METRES = 6371000;
/** Right handed Earth: Greenwich +Z, east +X, north +Y. */
export function earthPoint(lon: number, lat: number, metres = 0) {
  const a = (lon * Math.PI) / 180,
    b = (lat * Math.PI) / 180;
  const r = 1 + metres / EARTH_METRES;
  return new THREE.Vector3(
    r * Math.cos(b) * Math.sin(a),
    r * Math.sin(b),
    r * Math.cos(b) * Math.cos(a),
  );
}

export function elevationAt(grid: Int16Array | null, lon: number, lat: number) {
  if (!grid) return 0;
  const x = (((lon + 180) / 360) * 2048 - 0.5 + 2048) % 2048;
  const y = Math.max(0, Math.min(1023, ((90 - lat) / 180) * 1024 - 0.5));
  const i = Math.floor(x),
    j = Math.floor(y),
    dx = x - i,
    dy = y - j;
  const at = (xx: number, yy: number) =>
    grid[Math.min(1023, yy) * 2048 + (xx % 2048)];
  return (
    (at(i, j) * (1 - dx) + at(i + 1, j) * dx) * (1 - dy) +
    (at(i, j + 1) * (1 - dx) + at(i + 1, j + 1) * dx) * dy
  );
}

/** NOAA fixed-grid forward navigation; scan angles, sweep X, source origin 75 W.
 * JPEG registration is a presentation approximation, not calibrated ABI navigation.
 */
export function goesUV(lon: number, lat: number) {
  const req = 6378137,
    rpol = 6356752.31414,
    H = 42164160;
  const phi = (lat * Math.PI) / 180,
    a = ((lon + 75.0) * Math.PI) / 180;
  const geocentric = Math.atan(((rpol * rpol) / (req * req)) * Math.tan(phi));
  const rc =
    rpol /
    Math.sqrt(
      1 - (1 - (rpol * rpol) / (req * req)) * Math.cos(geocentric) ** 2,
    );
  const px = rc * Math.cos(geocentric) * Math.cos(a),
    py = rc * Math.cos(geocentric) * Math.sin(a),
    pz = rc * Math.sin(geocentric);
  const sx = H - px;
  if (H * px < px * px + py * py + ((req * req) / (rpol * rpol)) * pz * pz)
    return null;
  const scanX = Math.asin(py / Math.hypot(sx, py, pz)),
    scanY = Math.atan(pz / sx);
  return { u: 0.5 + scanX / 0.303744, v: 0.5 - scanY / 0.303744 };
}

export function reliefGeometry(grid: Int16Array | null, scale: number) {
  const w = 768,
    h = 384,
    positions: number[] = [],
    uv: number[] = [],
    indices: number[] = [];
  for (let j = 0; j <= h; j++)
    for (let i = 0; i <= w; i++) {
      const lon = (i / w) * 360 - 180,
        lat = 90 - (j / h) * 180;
      positions.push(
        ...earthPoint(lon, lat, elevationAt(grid, lon, lat) * scale).toArray(),
      );
      uv.push(i / w, 1 - j / h);
    }
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const a = j * (w + 1) + i,
        b = a + w + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
