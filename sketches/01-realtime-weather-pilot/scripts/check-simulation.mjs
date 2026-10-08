import ts from 'typescript';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const compile = async (path) => {
  const input = await fs.readFile(path, 'utf8');
  const result = ts.transpileModule(input, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  return import(
    'data:text/javascript;base64,' +
      Buffer.from(result.outputText).toString('base64')
  );
};
const { TransportSimulation, sampleGrid } = await compile(
  'lib/weather/simulation.ts',
);
const { atlantic, validateContribution } = await compile(
  'lib/weather/contributions.ts',
);
let passed = 0;
function check(label, test) {
  test();
  passed++;
  console.log('PASS', label);
}
const advance = (s, h) => {
  for (let i = 0; i < h * 12; i++) s.step();
  return s;
};
check('zero wind / zero diffusion leaves every position stationary', () => {
  const s = new TransportSimulation(
    {
      ...atlantic,
      parameters: { ...atlantic.parameters, wind: 0, diffusion: 0 },
    },
    80,
  );
  const initial = s.positions.slice();
  advance(s, 12);
  for (let i = 0; i < 80; i++) {
    assert.equal(s.positions[i * 3], initial[i * 3]);
    assert.equal(s.positions[i * 3 + 1], initial[i * 3 + 1]);
  }
});
check('mass follows analytical exponential decay', () => {
  const s = advance(new TransportSimulation(atlantic, 100), 24);
  assert.ok(Math.abs(s.metrics().mass - 100 * Math.exp(-24 / 48)) < 0.001);
});
check('seeded runs produce identical trajectories', () => {
  const a = advance(new TransportSimulation(atlantic, 100), 24),
    b = advance(new TransportSimulation(atlantic, 100), 24);
  assert.deepEqual(a.positions, b.positions);
});
check('changing wind changes displacement', () => {
  const a = advance(
      new TransportSimulation(
        {
          ...atlantic,
          parameters: { ...atlantic.parameters, wind: 0, diffusion: 0 },
        },
        100,
      ),
      24,
    ),
    b = advance(
      new TransportSimulation(
        {
          ...atlantic,
          parameters: { ...atlantic.parameters, wind: 30, diffusion: 0 },
        },
        100,
      ),
      24,
    );
  assert.ok(a.metrics().distance < 0.001);
  assert.ok(b.metrics().distance > 500);
});
check('72-hour integration remains finite and bounded', () => {
  const s = advance(
    new TransportSimulation(
      {
        ...atlantic,
        parameters: { ...atlantic.parameters, wind: 40, diffusion: 100000 },
      },
      2400,
    ),
    72,
  );
  for (let i = 0; i < s.positions.length; i += 3) {
    assert.ok(Number.isFinite(s.positions[i]));
    assert.ok(s.positions[i] >= -180 && s.positions[i] <= 180);
    assert.ok(s.positions[i + 1] >= -85 && s.positions[i + 1] <= 85);
    assert.ok(s.positions[i + 2] >= 0 && s.positions[i + 2] <= 1);
  }
});
const grid = {
  width: 2,
  height: 2,
  west: -90,
  south: 0,
  dx: 90,
  dy: 70,
  u: [10, 20, 30, 40],
  v: [0, 10, 20, 30],
  units: 'm/s',
};
check('bilinear interpolation matches known grid center', () =>
  assert.deepEqual(sampleGrid(grid, -45, 35), [25, 15]),
);
check('outside grid is explicitly unsupported', () =>
  assert.equal(sampleGrid(grid, 20, 35), null),
);
check('constant gridded flow matches analytic displacement', () => {
  const s = new TransportSimulation(
    {
      ...atlantic,
      kind: 'gridded',
      grid: { ...grid, u: [10, 10, 10, 10], v: [0, 0, 0, 0] },
      parameters: { ...atlantic.parameters, wind: 18, diffusion: 0 },
    },
    1,
  );
  const start = s.positions.slice();
  advance(s, 6);
  const expected =
    (((10 * 21600) / 6371000) * 180) /
    Math.PI /
    Math.cos((start[1] * Math.PI) / 180);
  assert.ok(Math.abs(s.positions[0] - start[0] - expected) < 0.001);
  assert.equal(s.positions[1], start[1]);
});
check('valid portable contribution is accepted', () =>
  assert.equal(validateContribution(atlantic).id, 'atlantic-drift'),
);
check('hostile links and malformed grids are rejected', () => {
  assert.throws(() =>
    validateContribution({
      ...atlantic,
      source: { ...atlantic.source, url: 'javascript:alert(1)' },
    }),
  );
  assert.throws(() =>
    validateContribution({
      ...atlantic,
      kind: 'gridded',
      grid: { ...grid, u: [NaN] },
    }),
  );
  assert.throws(() =>
    validateContribution({
      ...atlantic,
      parameters: { ...atlantic.parameters, wind: Infinity },
    }),
  );
  assert.throws(() => validateContribution({ ...atlantic, chapters: [] }));
});

check('zero vertical mixing preserves release height', () => {
  const s = advance(
    new TransportSimulation(
      {
        ...atlantic,
        parameters: {
          ...atlantic.parameters,
          releaseHeight: 3210,
          verticalDiffusion: 0,
        },
      },
      100,
    ),
    72,
  );
  assert.ok(s.heights.every((h) => h === 3210));
});
check('vertical diffusion matches 2Kt variance away from boundaries', () => {
  const s = advance(
    new TransportSimulation(
      {
        ...atlantic,
        parameters: {
          ...atlantic.parameters,
          releaseHeight: 6000,
          verticalDiffusion: 1,
        },
      },
      8000,
    ),
    1,
  );
  const mean = s.heights.reduce((a, b) => a + b, 0) / s.count;
  const variance = s.heights.reduce((a, b) => a + (b - mean) ** 2, 0) / s.count;
  assert.ok(Math.abs(variance - 7200) / 7200 < 0.06);
});
check(
  'vertical mixing is reproducible and leaves horizontal trajectories unchanged',
  () => {
    const a = advance(new TransportSimulation(atlantic, 100), 24),
      b = advance(new TransportSimulation(atlantic, 100), 24);
    const c = advance(
      new TransportSimulation(
        {
          ...atlantic,
          parameters: { ...atlantic.parameters, verticalDiffusion: 0 },
        },
        100,
      ),
      24,
    );
    assert.deepEqual(a.heights, b.heights);
    assert.deepEqual(a.positions, c.positions);
    assert.notDeepEqual(a.heights, c.heights);
    assert.equal(a.history.length, a.heightHistory.length * 2);
  },
);
check('reflecting model boundaries conserve weight and bound height', () => {
  const s = advance(
    new TransportSimulation(
      {
        ...atlantic,
        parameters: {
          ...atlantic.parameters,
          releaseHeight: 0,
          verticalDiffusion: 50,
        },
      },
      1000,
    ),
    72,
  );
  assert.ok(s.heights.every((h) => Number.isFinite(h) && h >= 0 && h <= 12000));
  assert.ok(Math.abs(s.metrics().mass - 100 * Math.exp(-72 / 48)) < 0.001);
  assert.throws(() =>
    validateContribution({
      ...atlantic,
      parameters: { ...atlantic.parameters, releaseHeight: Infinity },
    }),
  );
  assert.throws(() =>
    validateContribution({
      ...atlantic,
      parameters: { ...atlantic.parameters, verticalDiffusion: -1 },
    }),
  );
});
const { createProjection } = await compile('lib/weather/projection.ts');
check(
  '3D projection occludes the far side and exposes elevated horizon points',
  () => {
    const p = createProjection(0, 0, 100, 0, 0, 200);
    assert.ok(p(180, 0, 0).z < 0);
    assert.ok(p(100, 0, 0).z < 0);
    assert.ok(p(100, 0, 3000).z > 0);
    assert.equal(p(0, 0, 0).x, 0);
    const exact = createProjection(0, 0, 100, 0, 0, 1);
    assert.ok(p(60, 0, 3000).x > exact(60, 0, 3000).x);
  },
);
const start = performance.now();
advance(new TransportSimulation(atlantic, 2400), 72);
console.log(
  'BENCHMARK full 72-hour run / 2,400 particles:',
  Math.round(performance.now() - start),
  'ms',
);
await fs.mkdir('public/examples', { recursive: true });
await fs.writeFile(
  'public/examples/atlantic.json',
  JSON.stringify(atlantic, null, 2),
);
const sample = {
  ...atlantic,
  id: 'uniform-wind-study',
  title: 'One field, one direction',
  author: 'Student starter',
  kind: 'gridded',
  description:
    'A controlled experiment with a uniform 12 m/s eastward wind. Replace the regular grid with your own documented field.',
  source: {
    title: 'Synthetic uniform wind grid',
    url: 'https://www.arl.noaa.gov/hysplit/',
    license: 'CC BY 4.0',
    note: 'Teaching fixture: a uniform eastward 12 m/s synthetic wind, not observational data. Bilinear interpolation, absorbing domain boundaries. Replace this note with a real source, timestamp and processing history when using measured or reanalyzed data.',
  },
  parameters: { ...atlantic.parameters, longitude: -65, latitude: 33 },
  grid: {
    width: 13,
    height: 9,
    west: -100,
    south: 0,
    dx: 10,
    dy: 10,
    u: Array(117).fill(12),
    v: Array(117).fill(0),
    units: 'm/s',
  },
};
sample.chapters = [
  {
    label: '01 / RELEASE',
    title: 'A controlled starting point',
    text: 'This synthetic fixture releases tracers at 65°W, 33°N into a uniform eastward wind. It is designed to make coordinate order and units easy to verify.',
    longitude: -65,
    latitude: 33,
  },
  {
    label: '02 / FIELD',
    title: 'Twelve metres per second',
    text: 'Every grid point has u = 12 m/s and v = 0. The default multiplier is one. With diffusion disabled, motion follows a latitude circle at a known speed.',
    longitude: -45,
    latitude: 33,
  },
  {
    label: '03 / BOUNDARY',
    title: 'A finite field of knowledge',
    text: 'The imported field has a geographic boundary. Particles leaving it are removed, and the remaining-mass metric includes this domain loss. Missing knowledge is not replaced with an invented wind.',
    longitude: 20,
    latitude: 33,
  },
];
validateContribution(sample);
await fs.writeFile(
  'public/examples/uniform-grid.json',
  JSON.stringify(sample, null, 2),
);
console.log(passed + ' checks passed; example contributions generated.');
