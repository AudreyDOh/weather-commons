#!/usr/bin/env node
// Download Natural Earth map layers (public domain) and keep only the area this sketch shows.
//
//   node tools/prepare-map.mjs            (run from this sketch's folder; needs Node 18+ and internet)
//
// To adapt the sketch to another place, change AREA. Writes data/map.json with coastlines,
// country borders, rivers and towns, rounded to 0.01° (about 1 km).
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AREA = { west: 100, east: 112, south: 10, north: 21 };
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/';
const SOURCES = {
  coast: NE + 'ne_10m_coastline.geojson',
  borders: NE + 'ne_10m_admin_0_boundary_lines_land.geojson',
  rivers: NE + 'ne_10m_rivers_lake_centerlines.geojson',
  towns: NE + 'ne_10m_populated_places_simple.geojson',
};
const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

const inside = ([x, y], m = 0) => x >= AREA.west - m && x <= AREA.east + m && y >= AREA.south - m && y <= AREA.north + m;
const round = ([x, y]) => [+x.toFixed(2), +y.toFixed(2)];

// Split each line into the runs that fall inside the area (with a small margin), simplified to ~1 km.
function clipLines(geojson, keep = () => true) {
  const out = [];
  for (const f of geojson.features) {
    if (!keep(f)) continue;
    const g = f.geometry;
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : [];
    for (const line of lines) {
      let run = [];
      for (const p of line) {
        if (inside(p, 0.5)) {
          const q = round(p), last = run[run.length - 1];
          if (!last || last[0] !== q[0] || last[1] !== q[1]) run.push(q);
        } else { if (run.length > 1) out.push(run); run = []; }
      }
      if (run.length > 1) out.push(run);
    }
  }
  return out;
}

const get = async (url) => { const r = await fetch(url); if (!r.ok) throw Error(`${url}: ${r.status}`); return r.json(); };
const [coast, borders, rivers, towns] = await Promise.all(Object.values(SOURCES).map(get));

const map = {
  what: 'Natural Earth 1:10m layers, public domain, clipped to the area. Present-day cartography, not 1966.',
  sources: SOURCES,
  area: AREA,
  coast: clipLines(coast),
  borders: clipLines(borders),
  rivers: clipLines(rivers, (f) => (f.properties.scalerank ?? 9) <= 6), // main rivers only
  riverNames: [...new Set(rivers.features.filter((f) => clipLines({ features: [f] }).length).map((f) => f.properties.name).filter(Boolean))],
  towns: towns.features
    .filter((f) => inside(f.geometry.coordinates))
    .map((f) => ({ name: f.properties.name, longitude: +f.geometry.coordinates[0].toFixed(3), latitude: +f.geometry.coordinates[1].toFixed(3), country: f.properties.adm0name, rank: f.properties.scalerank })),
};
await fs.mkdir(DIR, { recursive: true });
await fs.writeFile(path.join(DIR, 'map.json'), JSON.stringify(map));
console.log(`coast ${map.coast.length} lines, borders ${map.borders.length}, rivers ${map.rivers.length}, towns ${map.towns.length}`);
