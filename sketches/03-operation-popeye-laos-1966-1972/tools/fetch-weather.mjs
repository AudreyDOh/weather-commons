#!/usr/bin/env node
// Download the weather this sketch uses, from ERA5 reanalysis via Open-Meteo's historical API.
//
//   node tools/fetch-weather.mjs          (run from this sketch's folder; needs Node 18+ and internet)
//
// To adapt the sketch to another event, change SETTINGS: the area, the days and the place
// where you want daily rainfall. ERA5 starts in 1940. Keep the grid small: every point is a
// separate time series, and Open-Meteo is a free service with fair-use limits.
//
// Writes:
//   data/raw/wind.json, data/raw/rain.json   the responses exactly as downloaded
//   data/wind.json                           hourly east/north wind on the grid, in m/s
//   data/rain.json                           daily rainfall at one place, in mm
//   data/manifest.json                       request addresses, download time, SHA-256 of every file
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SETTINGS = {
  // Wind: a 1° grid over the Lao panhandle and the routes through it, 100 m above ground.
  west: 102, east: 110, south: 12, north: 19, step: 1,
  windStart: '1966-10-01', windEnd: '1966-10-07',
  // Rainfall: the Se Kong valley, where the memo places the October 1966 tests.
  rainPlace: { name: 'Se Kong valley', latitude: 15.5, longitude: 107 },
  rainStart: '1966-09-01', rainEnd: '1966-11-30',
};

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');
const API = 'https://archive-api.open-meteo.com/v1/archive?';
const s = SETTINGS;

const points = [];
for (let lat = s.south; lat <= s.north; lat += s.step)
  for (let lon = s.west; lon <= s.east; lon += s.step) points.push({ lat, lon });
const width = Math.round((s.east - s.west) / s.step) + 1;
const height = Math.round((s.north - s.south) / s.step) + 1;

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw Error(`Open-Meteo answered ${r.status}: ${await r.text()}`);
  return { text: await r.text() };
}

const windUrl = API + new URLSearchParams({
  latitude: points.map((p) => p.lat).join(','),
  longitude: points.map((p) => p.lon).join(','),
  start_date: s.windStart,
  end_date: s.windEnd,
  hourly: 'wind_speed_100m,wind_direction_100m',
  wind_speed_unit: 'ms',
  models: 'era5',
  timezone: 'GMT',
  elevation: points.map(() => 'nan').join(','), // the grid cell itself, no downscaling to terrain
  cell_selection: 'nearest',
});
const rainUrl = API + new URLSearchParams({
  latitude: s.rainPlace.latitude,
  longitude: s.rainPlace.longitude,
  start_date: s.rainStart,
  end_date: s.rainEnd,
  daily: 'precipitation_sum',
  models: 'era5',
  timezone: 'GMT',
  elevation: 'nan',
  cell_selection: 'nearest',
});

const windRaw = await get(windUrl);
const rainRaw = await get(rainUrl);
const cells = JSON.parse(windRaw.text);
const rain = JSON.parse(rainRaw.text);
if (!Array.isArray(cells) || cells.length !== points.length) throw Error(`Expected ${points.length} wind series`);
const times = cells[0].hourly.time;

// Meteorological direction is where the wind comes FROM. u = east, v = north.
const u = times.map(() => []), v = times.map(() => []);
for (const cell of cells) {
  const speed = cell.hourly.wind_speed_100m, dir = cell.hourly.wind_direction_100m;
  times.forEach((_, t) => {
    if (speed[t] === null || dir[t] === null) throw Error('Missing wind value');
    const a = (dir[t] * Math.PI) / 180;
    u[t].push(+(-speed[t] * Math.sin(a)).toFixed(2));
    v[t].push(+(-speed[t] * Math.cos(a)).toFixed(2));
  });
}
if (rain.daily.precipitation_sum.some((x) => x === null)) throw Error('Missing rainfall value');

const wind = {
  what: 'ERA5 reanalysis wind 100 m above ground, hourly, via Open-Meteo. Reanalysed, not observed at each point.',
  units: 'm/s', grid: { west: s.west, south: s.south, dx: s.step, dy: s.step, width, height },
  order: 'each hour lists points row by row, south to north, west to east',
  times, u, v,
};
const rainOut = {
  what: 'ERA5 reanalysis daily precipitation via Open-Meteo, at the nearest grid cell. Reanalysed, not a rain gauge.',
  units: 'mm', place: s.rainPlace, cell: { latitude: rain.latitude, longitude: rain.longitude },
  dates: rain.daily.time, mm: rain.daily.precipitation_sum,
};

await fs.mkdir(path.join(DIR, 'raw'), { recursive: true });
const files = {
  'raw/wind.json': windRaw.text,
  'raw/rain.json': rainRaw.text,
  'wind.json': JSON.stringify(wind),
  'rain.json': JSON.stringify(rainOut),
};
const sha256 = {};
for (const [name, text] of Object.entries(files)) {
  await fs.writeFile(path.join(DIR, name), text);
  sha256[name] = crypto.createHash('sha256').update(text).digest('hex');
}
await fs.writeFile(path.join(DIR, 'manifest.json'), JSON.stringify({
  retrievedAt: new Date().toISOString(),
  producer: 'ECMWF ERA5 (Hersbach et al. 2020, doi:10.24381/cds.adbb2d47), served by Open-Meteo (doi:10.5281/zenodo.7970649), CC BY 4.0',
  settings: SETTINGS,
  requests: { wind: windUrl, rain: rainUrl },
  transform: 'u = -speed·sin(direction), v = -speed·cos(direction), rounded to 0.01 m/s. Rainfall unchanged.',
  sha256,
}, null, 2) + '\n');
console.log(`wind: ${points.length} points × ${times.length} hours; rain: ${rainOut.dates.length} days, ${rainOut.mm.reduce((a, b) => a + b, 0).toFixed(0)} mm`);
