import fs from 'node:fs/promises';
const points = [];
for (let lat = 12; lat <= 18; lat++)
  for (let lon = 103; lon <= 109; lon++) points.push({ lat, lon });
const params = new URLSearchParams({
  latitude: points.map((p) => p.lat).join(','),
  longitude: points.map((p) => p.lon).join(','),
  start_date: '1966-10-01',
  end_date: '1966-10-01',
  hourly: 'wind_speed_100m,wind_direction_100m',
  wind_speed_unit: 'ms',
  models: 'era5',
  timezone: 'GMT',
  elevation: points.map(() => 'nan').join(','),
  cell_selection: 'nearest',
});
const url = 'https://archive-api.open-meteo.com/v1/archive?' + params;
const response = await fetch(url);
if (!response.ok) throw Error(await response.text());
const wind = await response.json();
if (!Array.isArray(wind) || wind.length !== 49)
  throw Error('Expected 49 samples');
for (const cell of wind)
  if (
    cell.hourly.wind_speed_100m.some((x) => x === null) ||
    cell.hourly.wind_direction_100m.some((x) => x === null)
  )
    throw Error('Missing wind');
const dailyUrl =
  'https://archive-api.open-meteo.com/v1/archive?latitude=15.5&longitude=107&start_date=1966-10-01&end_date=1966-10-31&daily=precipitation_sum&models=era5&timezone=GMT&elevation=nan&cell_selection=nearest';
const d = await fetch(dailyUrl);
if (!d.ok) throw Error(await d.text());
const rain = await d.json();
if (rain.daily.precipitation_sum.some((x) => x === null))
  throw Error('Missing rainfall');
await fs.mkdir('public/data/archive', { recursive: true });
await fs.writeFile(
  'public/data/archive/era5-wind-raw.json',
  JSON.stringify(wind),
);
await fs.writeFile(
  'public/data/archive/era5-rain-raw.json',
  JSON.stringify(rain),
);
const u = [],
  v = [];
for (const cell of wind) {
  const speed = cell.hourly.wind_speed_100m[0],
    direction = (cell.hourly.wind_direction_100m[0] * Math.PI) / 180;
  u.push(Number((-speed * Math.sin(direction)).toFixed(5)));
  v.push(Number((-speed * Math.cos(direction)).toFixed(5)));
}
const result = {
  retrievedAt: new Date().toISOString(),
  windUrl: url,
  rainUrl: dailyUrl,
  validTime: '1966-10-01T00:00:00Z',
  requestedPoints: points,
  returnedPoints: wind.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    elevation: p.elevation,
  })),
  grid: {
    width: 7,
    height: 7,
    west: 103,
    south: 12,
    dx: 1,
    dy: 1,
    u,
    v,
    units: 'm/s',
  },
  rain: {
    latitude: rain.latitude,
    longitude: rain.longitude,
    dates: rain.daily.time,
    mm: rain.daily.precipitation_sum,
  },
};
await fs.writeFile(
  'public/data/popeye-archive.json',
  JSON.stringify(result, null, 2),
);
console.log({
  samples: wind.length,
  firstCell: result.returnedPoints[0],
  lastCell: result.returnedPoints[48],
  windRange: [Math.min(...u), Math.max(...u)],
  monthlyPrecip: rain.daily.precipitation_sum.reduce((a, b) => a + b, 0),
});
