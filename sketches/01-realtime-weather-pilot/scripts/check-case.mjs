import fs from 'node:fs/promises';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
async function compile(path) {
  let source = await fs.readFile(path, 'utf8');
  if (path.endsWith('case-study.ts')) {
    source = source
      .replace(
        "import archive from '@/public/data/popeye-archive.json';",
        'const archive=' +
          (await fs.readFile('public/data/popeye-archive.json', 'utf8')) +
          ';',
      )
      .replace(
        "import geography from '@/public/data/laos-geography.json';",
        'const geography=' +
          (await fs.readFile('public/data/laos-geography.json', 'utf8')) +
          ';',
      );
  }
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(
        ts.transpileModule(source, {
          compilerOptions: {
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022,
          },
        }).outputText,
      ).toString('base64')
  );
}
const { popeye, archive, geography } = await compile(
  'lib/weather/case-study.ts',
);
const { validateContribution } = await compile('lib/weather/contributions.ts');
const { TransportSimulation } = await compile('lib/weather/simulation.ts');
validateContribution(popeye);
const raw = JSON.parse(
  await fs.readFile('public/data/archive/era5-wind-raw.json', 'utf8'),
);
assert.equal(raw.length, 49);
for (let n = 0; n < 49; n++) {
  const cell = raw[n],
    point = archive.requestedPoints[n];
  assert.equal(cell.latitude, point.lat);
  assert.equal(cell.longitude, point.lon);
  assert.equal(cell.hourly_units.wind_speed_100m, 'm/s');
  assert.equal(cell.hourly.time[0], '1966-10-01T00:00');
  const speed = cell.hourly.wind_speed_100m[0],
    angle = (cell.hourly.wind_direction_100m[0] * Math.PI) / 180;
  assert.ok(Math.abs(popeye.grid.u[n] + speed * Math.sin(angle)) < 0.00001);
  assert.ok(Math.abs(popeye.grid.v[n] + speed * Math.cos(angle)) < 0.00001);
  assert.equal(point.lat, 12 + Math.floor(n / 7));
  assert.equal(point.lon, 103 + (n % 7));
}
console.log(
  'PASS 49 genuine API samples align with grid; meteorological direction converts to east/north m/s',
);
assert.equal(archive.rain.mm.length, 31);
assert.ok(archive.rain.mm.every((x) => Number.isFinite(x) && x >= 0));
assert.ok(Math.abs(archive.rain.mm.reduce((a, b) => a + b, 0) - 119.7) < 0.001);
console.log(
  'PASS October precipitation is complete and totals 119.7 mm at the archive grid point',
);
const sim = new TransportSimulation(popeye, 2400);
for (let i = 0; i < 2400; i++) {
  const dy = (sim.positions[i * 3 + 1] - 15.5) * 111.2,
    dx =
      (sim.positions[i * 3] - 107) * 111.2 * Math.cos((15.5 * Math.PI) / 180);
  assert.ok(Math.hypot(dx, dy) <= 25.02);
}
for (let n = 0; n < 288; n++) sim.step();
assert.ok(sim.positions.every(Number.isFinite));
assert.ok(sim.heights.every((h) => h === 100));
assert.ok(sim.metrics().distance > 0);
console.log(
  'PASS hypothetical 25 km release and 24-hour reanalysis-driven run are finite; height stays at 100 m',
);
assert.throws(() =>
  validateContribution({
    ...popeye,
    parameters: { ...popeye.parameters, releaseRadiusKm: NaN },
  }),
);
assert.ok(geography.places.length === 38 && geography.rivers.length > 0);
console.log(
  'PASS malformed release radius rejected; mapped places and river available',
);
await fs.writeFile(
  'public/examples/popeye-1966.json',
  JSON.stringify(popeye, null, 2),
);
const files = [
  'public/data/archive/era5-wind-raw.json',
  'public/data/archive/era5-rain-raw.json',
  'public/data/popeye-archive.json',
  'public/data/laos-geography.json',
];
const hashes = {};
for (const f of files)
  hashes[f] = createHash('sha256')
    .update(await fs.readFile(f))
    .digest('hex');
await fs.writeFile(
  'public/data/archive/manifest.json',
  JSON.stringify(
    {
      retrievedAt: archive.retrievedAt,
      requests: [archive.windUrl, archive.rainUrl],
      sha256: hashes,
      transform:
        'Meteorological FROM direction: u=-speed*sin(direction), v=-speed*cos(direction). Row-major south to north, west to east. 00 UTC frame retained; held stationary during simulation. Rainfall displayed separately, not coupled to tracers.',
    },
    null,
    2,
  ),
);
console.log('Case contribution and hashed provenance manifest exported.');
