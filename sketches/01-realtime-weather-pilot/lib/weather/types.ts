export type Parameters = {
  wind: number;
  diffusion: number;
  lifetime: number;
  latitude: number;
  longitude: number;
  seed: number;
  releaseRadiusKm?: number;
  releaseHeight?: number; // metres above a spherical reference surface
  verticalDiffusion?: number; // m²/s; absent means zero
};
export type WindGrid = {
  width: number;
  height: number;
  west: number;
  south: number;
  dx: number;
  dy: number;
  u: number[];
  v: number[];
  units: 'm/s';
};
export type Chapter = {
  title: string;
  label: string;
  text: string;
  longitude: number;
  latitude: number;
  source?: string;
};
export type Contribution = {
  schemaVersion: 1;
  id: string;
  title: string;
  author: string;
  description: string;
  kind: 'idealized' | 'gridded';
  source: { title: string; url: string; license: string; note: string };
  parameters: Parameters;
  chapters: Chapter[];
  grid?: WindGrid;
};
export type Snapshot = {
  positions: Float32Array;
  trails?: Float32Array;
  heights?: Float32Array;
  trailHeights?: Float32Array;
  meanHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  hours: number;
  mass: number;
  distance: number;
  spread: number;
  computeMs: number;
  finished: boolean;
};
export type Command =
  | { type: 'init'; contribution: Contribution; count: number }
  | { type: 'running'; value: boolean }
  | { type: 'speed'; value: number }
  | { type: 'seek'; hours: number };
