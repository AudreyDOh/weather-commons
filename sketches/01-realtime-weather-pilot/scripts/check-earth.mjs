import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  earthPoint,
  elevationAt,
  goesUV,
  EARTH_METRES,
} from '../lib/weather/earth-geometry.ts';

const root = 'public/data/archive/earth/';
const manifest = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
for (const record of manifest.files) {
  assert.equal(
    createHash('sha256')
      .update(fs.readFileSync(root + record.file))
      .digest('hex'),
    record.sha256,
    record.file + ' integrity',
  );
  if (record.url) {
    assert.ok(record.retrievedAt);
    assert.equal(new URL(record.url).protocol, 'https:');
  }
}
const bytes = fs.readFileSync(root + 'elevation.i16');
assert.equal(bytes.length, 2048 * 1024 * 2);
const grid = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.length / 2);
assert.ok(elevationAt(grid, -30, 25) < -1000, 'Atlantic floor below datum');
assert.ok(elevationAt(grid, 86.9, 27.9) > 2000, 'Himalaya above datum');
assert.ok(
  Math.abs(earthPoint(0, 0, 1000).length() - 1 - 1000 / EARTH_METRES) < 1e-12,
);
assert.ok(earthPoint(90, 0).x > 0.9999);
assert.ok(earthPoint(0, 90).y > 0.9999);
const centre = goesUV(-75, 0);
assert.equal(centre.u, 0.5);
assert.equal(centre.v, 0.5);
assert.ok(goesUV(-65, 0).u > 0.5, 'East projects right');
assert.ok(goesUV(-75, 20).v < 0.5, 'North projects upward in source image');
assert.equal(goesUV(105, 0), null, 'Opposite hemisphere has no GOES coverage');
const buildings = JSON.parse(fs.readFileSync(root + 'buildings.json', 'utf8'));
assert.equal(buildings.length, 522);
for (const building of buildings) {
  assert.ok(building.heightMethod);
  assert.ok(building.height >= 3 && building.height <= 600);
  assert.deepEqual(building.ring[0], building.ring.at(-1));
}
console.log(
  'PASS Earth: archived hashes, signed relief, metre scaling, GOES hemisphere/orientation, and 522 documented building extrusions',
);
