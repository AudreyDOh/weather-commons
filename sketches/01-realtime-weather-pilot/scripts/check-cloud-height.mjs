import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const root = 'public/data/archive/cloud-height/';
const manifest = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
const goes = JSON.parse(
  fs.readFileSync('public/data/archive/goes/manifest.json', 'utf8'),
);
const hash = (path) =>
  createHash('sha256').update(fs.readFileSync(path)).digest('hex');
assert.equal(manifest.frames.length, 12);
for (const record of manifest.listings) {
  assert.equal(hash(root + record.file), record.sha256);
  assert.ok(record.retrievedAt && record.url.startsWith('https://'));
}
assert.equal(manifest.projection.longitude_of_projection_origin, -75);
assert.equal(
  hash('public' + manifest.navigation.file),
  manifest.navigation.sha256,
);
const navBytes = fs.readFileSync('public' + manifest.navigation.file);
const nav = new Float32Array(
  navBytes.buffer,
  navBytes.byteOffset,
  navBytes.length / 4,
);
assert.equal(nav.length, 543 * 543 * 2);
for (const [i, f] of manifest.frames.entries()) {
  assert.equal(hash(root + f.original), f.sha256);
  assert.equal(hash('public' + f.file), f.derivedSha256);
  assert.equal(f.time, goes.products[0].frames[i].time);
  assert.ok(Date.parse(f.start) >= Date.parse(f.time));
  assert.ok(Date.parse(f.end) - Date.parse(f.start) < 600000);
  assert.ok(f.retrievedAt && new URL(f.source).protocol === 'https:');
  const bytes = fs.readFileSync('public' + f.file),
    height = new Uint16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
  assert.equal(height.length, 543 * 543);
  let valid = 0;
  for (let n = 0; n < height.length; n++)
    if (height[n] !== 65535) {
      valid++;
      assert.ok(height[n] <= 20000);
      assert.ok(Number.isFinite(nav[n * 2]));
      assert.ok(
        nav[n * 2] >= -180 &&
          nav[n * 2] <= 180 &&
          Math.abs(nav[n * 2 + 1]) <= 90,
      );
      assert.ok(
        nav[n * 2] !== 0 || nav[n * 2 + 1] !== 0,
        'valid height has Earth navigation',
      );
    }
  assert.equal(valid, f.validPixels);
}
let source = fs.readFileSync('lib/weather/cloud-height.ts', 'utf8');
source = source
  .replace("'three'", JSON.stringify(import.meta.resolve('three')))
  .replace(
    "'./earth-geometry'",
    JSON.stringify(
      pathToFileURL(process.cwd() + '/lib/weather/earth-geometry.ts').href,
    ),
  );
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
}).outputText;
const { cloudHeightGeometry } = await import(
  'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64')
);
const frame = {
  heights: new Uint16Array([1000, 1000, 1000, 1000]),
  navigation: new Float32Array([-75, 1, -74, 1, -75, 0, -74, 0]),
  index: 0,
};
let mesh = cloudHeightGeometry(frame, 1, 2);
assert.equal(mesh.index.count, 6);
mesh.dispose();
frame.heights[0] = 65535;
mesh = cloudHeightGeometry(frame, 1, 2);
assert.equal(mesh.index.count, 3, 'missing sample opens a hole');
mesh.dispose();
frame.heights[3] = 10000;
mesh = cloudHeightGeometry(frame, 1, 2);
assert.equal(mesh.index.count, 0, 'height discontinuity is not bridged');
mesh.dispose();
console.log(
  'PASS ACHA: 12 raw/derived hashes, matched scan windows, valid heights/navigation, missing-cell and discontinuity mesh gates',
);
