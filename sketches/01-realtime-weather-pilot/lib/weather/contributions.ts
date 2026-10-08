import type { Contribution } from './types';
export const atlantic: Contribution = {
  schemaVersion: 1,
  id: 'atlantic-drift',
  title: 'The ocean between us',
  author: 'Weather Commons · Pilot 01',
  kind: 'idealized',
  description:
    'Follow a passive tracer through an idealized Atlantic circulation. Change the conditions. Watch another geography emerge.',
  source: {
    title: 'Idealized Atlantic transport · v1',
    url: 'https://www.arl.noaa.gov/hysplit/',
    license: 'CC BY 4.0 (pilot content)',
    note: 'Synthetic stationary wind field, midpoint integration and seeded random-walk diffusion. Inspired by Lagrangian transport methods; not HYSPLIT output, observed weather, or a forecast. Height evolves by idealized vertical diffusion with reflecting boundaries at 0 and 12 km above a smooth reference sphere. The same horizontal wind applies at every height. No vertical wind, wind shear, terrain, chemistry, cloud physics or rain prediction.',
  },
  parameters: {
    wind: 18,
    diffusion: 18000,
    lifetime: 48,
    longitude: -65,
    latitude: 33,
    seed: 42,
    releaseHeight: 3000,
    verticalDiffusion: 3,
  },
  chapters: [
    {
      label: '01 / RELEASE',
      title: 'A point of departure',
      text: 'A cloud of 2,400 passive tracers starts east of the North American coast. Every point starts at 3 km above the reference sphere, with a location, a clock, and the same initial weight. This release is a thought experiment.',
      longitude: -65,
      latitude: 33,
    },
    {
      label: '02 / TRANSPORT',
      title: 'An atmosphere in motion',
      text: 'A prescribed jet and rotating circulation carry the tracers east. The trajectories are calculated, not prerecorded. Wind speed changes their travel; diffusion changes their spread.',
      longitude: -38,
      latitude: 40,
      source: 'https://www.arl.noaa.gov/hysplit/',
    },
    {
      label: '03 / OBSERVATION',
      title: 'The gaps between instruments',
      text: 'The Azores anchor this stop in a real geography. An observing-network registry can tell us what instruments exist; it cannot alone tell us which observations a particular model used.',
      longitude: -25.67,
      latitude: 37.74,
      source: 'https://oscar.wmo.int/surface/',
    },
    {
      label: '04 / KNOWLEDGE',
      title: 'Where a field becomes a forecast',
      text: 'ECMWF combines observations with model information to estimate the atmospheric state. Our synthetic field exposes the interface mechanics; an observational contribution must bring its own provenance.',
      longitude: -0.95,
      latitude: 51.43,
      source: 'https://www.ecmwf.int/en/research/data-assimilation',
    },
    {
      label: '05 / COMMONS',
      title: 'A shared sky. Unequal knowledge.',
      text: 'Which institutions can observe this movement? Who can calculate it, act on it, or contest its description? Export this experiment with its assumptions and build another account.',
      longitude: -20,
      latitude: 35,
    },
  ],
};
export function validateContribution(value: unknown): Contribution {
  if (!value || typeof value !== 'object')
    throw new Error('The file must contain a contribution object.');
  const c = value as Contribution,
    text = (v: unknown, max = 1200) =>
      typeof v === 'string' && v.length > 0 && v.length <= max,
    num = (v: unknown, min: number, max: number) =>
      typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
  if (
    c.schemaVersion !== 1 ||
    !text(c.id, 80) ||
    !text(c.title, 100) ||
    !text(c.author, 160) ||
    !text(c.description) ||
    !['idealized', 'gridded'].includes(c.kind)
  )
    throw new Error(
      'Missing title, author, description, ID, kind, or schemaVersion: 1.',
    );
  if (
    !c.source ||
    !text(c.source.title) ||
    !text(c.source.note) ||
    !text(c.source.license) ||
    !text(c.source.url) ||
    !/^https?:\/\//.test(c.source.url)
  )
    throw new Error(
      'Include a source title, HTTP(S) URL, license, and methods note.',
    );
  const p = c.parameters;
  if (p?.releaseRadiusKm !== undefined && !num(p.releaseRadiusKm, 1, 300))
    throw Error('Release radius must be 1–300 km.');
  if (
    !p ||
    !num(p.wind, 0, 40) ||
    !num(p.diffusion, 0, 100000) ||
    !num(p.lifetime, 6, 120) ||
    !num(p.latitude, -70, 70) ||
    !num(p.longitude, -180, 180) ||
    !num(p.seed, 0, 4294967295) ||
    !Number.isInteger(p.seed)
  )
    throw new Error(
      'Simulation parameters are missing or outside the supported ranges.',
    );
  if (
    (p.releaseHeight !== undefined && !num(p.releaseHeight, 0, 12000)) ||
    (p.verticalDiffusion !== undefined && !num(p.verticalDiffusion, 0, 50))
  )
    throw new Error(
      'Release height must be 0–12,000 m; vertical diffusion must be 0–50 m²/s.',
    );
  if (
    !Array.isArray(c.chapters) ||
    c.chapters.length < 1 ||
    c.chapters.length > 12 ||
    c.chapters.some(
      (s) =>
        !s ||
        !text(s.title, 150) ||
        !text(s.label, 80) ||
        !text(s.text, 1800) ||
        !num(s.latitude, -85, 85) ||
        !num(s.longitude, -180, 180) ||
        (s.source && !/^https?:\/\//.test(s.source)),
    )
  )
    throw new Error(
      'Include 1–12 narrative stops with coordinates and optional HTTP(S) source links.',
    );
  if (c.kind === 'gridded') {
    const g = c.grid;
    if (
      !g ||
      g.units !== 'm/s' ||
      !Number.isInteger(g.width) ||
      !Number.isInteger(g.height) ||
      !num(g.width, 2, 180) ||
      !num(g.height, 2, 90) ||
      !num(g.west, -180, 180) ||
      !num(g.south, -85, 85) ||
      !num(g.dx, 0.01, 180) ||
      !num(g.dy, 0.01, 85) ||
      g.west + (g.width - 1) * g.dx > 180 ||
      g.south + (g.height - 1) * g.dy > 85 ||
      ![g.u, g.v].every(
        (a) =>
          Array.isArray(a) &&
          a.length === g.width * g.height &&
          a.every((v) => num(v, -150, 150)),
      )
    )
      throw new Error(
        'Invalid wind grid: use finite row-major u/v in m/s, regular spacing, at most 180 × 90 cells.',
      );
    if (
      p.longitude < g.west ||
      p.longitude > g.west + (g.width - 1) * g.dx ||
      p.latitude < g.south ||
      p.latitude > g.south + (g.height - 1) * g.dy
    )
      throw new Error('Place the release inside the wind grid.');
  }
  return c;
}
