import type { Contribution, Parameters, WindGrid } from './types';
export const RADIUS = 6371000;
const DEG = Math.PI / 180;
export const wrap = (x: number) => ((((x + 180) % 360) + 360) % 360) - 180;
export function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Prescribed stationary wind, not a weather forecast. Velocities in m/s.
export function analyticWind(
  lon: number,
  lat: number,
  p: Parameters,
): [number, number] {
  const x = wrap(lon + 38) * Math.cos(43 * DEG),
    y = lat - 43;
  const vortex = Math.exp(-(x * x + y * y) / 420);
  const jet = Math.exp(
    -((lat - 38 - 7 * Math.sin((lon + 35) * DEG * 2)) ** 2) / 180,
  );
  return [
    p.wind * (0.24 + 0.92 * jet - 0.105 * y * vortex),
    p.wind * (0.2 * Math.cos((lon + 35) * DEG * 2) + 0.105 * x * vortex),
  ];
}
export function sampleGrid(
  g: WindGrid,
  lon: number,
  lat: number,
): [number, number] | null {
  const x = (lon - g.west) / g.dx,
    y = (lat - g.south) / g.dy;
  if (x < 0 || y < 0 || x > g.width - 1 || y > g.height - 1) return null;
  const i = Math.min(g.width - 2, Math.floor(x)),
    j = Math.min(g.height - 2, Math.floor(y)),
    a = x - i,
    b = y - j;
  const sample = (v: number[]) =>
    v[j * g.width + i] * (1 - a) * (1 - b) +
    v[j * g.width + i + 1] * a * (1 - b) +
    v[(j + 1) * g.width + i] * (1 - a) * b +
    v[(j + 1) * g.width + i + 1] * a * b;
  return [sample(g.u), sample(g.v)];
}
export class TransportSimulation {
  positions: Float32Array;
  initial: Float32Array;
  heights: Float32Array;
  heightHistory: number[] = [];
  verticalRng: () => number;
  seconds = 0;
  history: number[] = [];
  rng: () => number;
  constructor(
    public contribution: Contribution,
    public count = 2400,
  ) {
    this.rng = random(contribution.parameters.seed);
    this.positions = new Float32Array(count * 3);
    this.heights = new Float32Array(count).fill(
      contribution.parameters.releaseHeight ?? 0,
    );
    this.verticalRng = random(contribution.parameters.seed ^ 0x9e3779b9);
    const p = contribution.parameters;
    for (let i = 0; i < count; i++) {
      const angle = this.rng() * Math.PI * 2,
        r =
          Math.sqrt(this.rng()) *
          (p.releaseRadiusKm === undefined
            ? 1.7
            : (p.releaseRadiusKm * 1000) / RADIUS / DEG);
      this.positions[i * 3] = wrap(
        p.longitude + (Math.cos(angle) * r) / Math.cos(p.latitude * DEG),
      );
      this.positions[i * 3 + 1] = p.latitude + Math.sin(angle) * r;
      this.positions[i * 3 + 2] = 1;
    }
    this.initial = this.positions.slice();
    this.record();
  }
  record() {
    for (
      let i = 0;
      i < this.count;
      i += Math.max(1, Math.floor(this.count / 60))
    ) {
      this.history.push(this.positions[i * 3], this.positions[i * 3 + 1]);
      this.heightHistory.push(this.heights[i]);
    }
  }
  velocity(lon: number, lat: number): [number, number] | null {
    const c = this.contribution;
    if (c.kind === 'gridded' && c.grid) {
      const uv = sampleGrid(c.grid, lon, lat);
      return uv
        ? [(uv[0] * c.parameters.wind) / 18, (uv[1] * c.parameters.wind) / 18]
        : null;
    }
    return analyticWind(lon, lat, c.parameters);
  }
  step(dt = 300) {
    const p = this.contribution.parameters,
      diffusion = Math.sqrt(2 * p.diffusion * dt),
      decay = Math.exp(-dt / (p.lifetime * 3600));
    const normal = () =>
      Math.sqrt(-2 * Math.log(Math.max(1e-12, this.rng()))) *
      Math.cos(2 * Math.PI * this.rng());
    for (let i = 0; i < this.count; i++) {
      const n = i * 3;
      if (this.positions[n + 2] === 0) continue;
      const lon = this.positions[n],
        lat = this.positions[n + 1],
        uv = this.velocity(lon, lat);
      if (!uv) {
        this.positions[n + 2] = 0;
        continue;
      }
      const latMid = lat + (uv[1] * dt) / 2 / RADIUS / DEG,
        lonMid =
          lon +
          (uv[0] * dt) / 2 / RADIUS / DEG / Math.max(0.1, Math.cos(lat * DEG)),
        mid = this.velocity(wrap(lonMid), latMid);
      if (!mid) {
        this.positions[n + 2] = 0;
        continue;
      }
      this.positions[n] = wrap(
        lon +
          (mid[0] * dt + diffusion * normal()) /
            RADIUS /
            DEG /
            Math.max(0.1, Math.cos(latMid * DEG)),
      );
      this.positions[n + 1] = Math.max(
        -85,
        Math.min(85, lat + (mid[1] * dt + diffusion * normal()) / RADIUS / DEG),
      );
      // Idealized vertical diffusion; reflecting boundaries, no deposition or vertical wind.
      const kz = p.verticalDiffusion ?? 0;
      if (kz > 0) {
        const normalZ =
          Math.sqrt(-2 * Math.log(Math.max(1e-12, this.verticalRng()))) *
          Math.cos(2 * Math.PI * this.verticalRng());
        const raw = this.heights[i] + Math.sqrt(2 * kz * dt) * normalZ;
        const folded = ((raw % 24000) + 24000) % 24000;
        this.heights[i] = folded <= 12000 ? folded : 24000 - folded;
      }
      this.positions[n + 2] *= decay;
    }
    this.seconds += dt;
    if (this.seconds % 3600 === 0) this.record();
  }
  metrics() {
    let mass = 0,
      distance = 0,
      meanLat = 0,
      sinLon = 0,
      cosLon = 0,
      count = 0;
    for (let i = 0; i < this.count; i++) {
      const n = i * 3;
      mass += this.positions[n + 2];
      if (!this.positions[n + 2]) continue;
      count++;
      const lon = this.positions[n],
        lat = this.positions[n + 1];
      meanLat += lat;
      sinLon += Math.sin(lon * DEG);
      cosLon += Math.cos(lon * DEG);
      const a = (lat - this.initial[n + 1]) * DEG,
        b = wrap(lon - this.initial[n]) * DEG,
        h =
          Math.sin(a / 2) ** 2 +
          Math.cos(lat * DEG) *
            Math.cos(this.initial[n + 1] * DEG) *
            Math.sin(b / 2) ** 2;
      distance += 2 * RADIUS * Math.asin(Math.sqrt(Math.min(1, h)));
    }
    const centerLon = Math.atan2(sinLon, cosLon) / DEG,
      centerLat = meanLat / Math.max(1, count);
    let spread = 0;
    for (let i = 0; i < this.count; i++) {
      const n = i * 3;
      if (!this.positions[n + 2]) continue;
      spread +=
        ((wrap(this.positions[n] - centerLon) * Math.cos(centerLat * DEG)) **
          2 +
          (this.positions[n + 1] - centerLat) ** 2) *
        (RADIUS * DEG) ** 2;
    }
    let sumHeight = 0,
      minHeight = Infinity,
      maxHeight = 0;
    for (let i = 0; i < this.count; i++) {
      if (!this.positions[i * 3 + 2]) continue;
      sumHeight += this.heights[i];
      minHeight = Math.min(minHeight, this.heights[i]);
      maxHeight = Math.max(maxHeight, this.heights[i]);
    }
    return {
      meanHeight: sumHeight / Math.max(1, count),
      minHeight: count ? minHeight : 0,
      maxHeight,
      mass: (mass / this.count) * 100,
      distance: distance / Math.max(1, count) / 1000,
      spread: Math.sqrt(spread / Math.max(1, count)) / 1000,
    };
  }
}
