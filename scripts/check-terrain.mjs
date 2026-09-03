import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { Matrix4, Vector3 } from 'three';
import {
  cameraMode,
  cameraHeading,
  cameraTilt,
  panAnchor,
} from '../lib/weather/navigation.ts';
import {
  regionalElevation,
  inTerrainRegion,
} from '../lib/weather/terrain-catalog.ts';
const root = 'public/data/archive/rainier/';
const manifest = JSON.parse(fs.readFileSync(root + 'manifest.json', 'utf8'));
for (const item of [...manifest.files, ...manifest.derived]) {
  assert.equal(
    createHash('sha256')
      .update(fs.readFileSync(root + item.file))
      .digest('hex'),
    item.sha256,
    item.file,
  );
  if (item.url) assert.ok(item.retrievedAt && item.url.startsWith('https://'));
}
const bytes = fs.readFileSync(root + 'elevation.f32'),
  grid = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.length / 4);
assert.equal(grid.length, 513 * 513);
assert.ok(regionalElevation(grid, -121.76, 46.86) > 3500);
assert.equal(
  regionalElevation(grid, -121.76 + 360, 46.86),
  regionalElevation(grid, -121.76, 46.86),
);
assert.equal(regionalElevation(grid, 0, 0), null);
assert.equal(inTerrainRegion(0, 0), false);
const tileset = JSON.parse(fs.readFileSync(root + 'tileset.json', 'utf8'));
assert.equal(tileset.asset.version, '1.1');
assert.equal(tileset.asset.gltfUpAxis, 'Y');
let count = 0;
const levels = new Set();
function check(tile, parentMatrix, parentError = Infinity) {
  count++;
  levels.add(tile.extras.level);
  assert.ok(tile.geometricError <= parentError);
  assert.equal(tile.refine, 'REPLACE');
  const world = parentMatrix
    .clone()
    .multiply(new Matrix4().fromArray(tile.transform));
  const buf = fs.readFileSync(root + tile.content.uri);
  assert.equal(buf.readUInt32LE(0), 0x46546c67);
  assert.equal(buf.readUInt32LE(4), 2);
  assert.equal(buf.readUInt32LE(8), buf.length);
  const n = buf.readUInt32LE(12),
    gltf = JSON.parse(buf.subarray(20, 20 + n).toString('utf8'));
  const bin = 28 + n;
  const mesh = gltf.meshes[0].primitives[0],
    pos = gltf.accessors[mesh.attributes.POSITION],
    view = gltf.bufferViews[pos.bufferView];
  assert.equal(pos.count, 4481);
  assert.equal(gltf.accessors[mesh.indices].count, 26112);
  const position = (i) =>
    new Vector3(
      buf.readFloatLE(bin + view.byteOffset + i * 12),
      buf.readFloatLE(bin + view.byteOffset + i * 12 + 4),
      buf.readFloatLE(bin + view.byteOffset + i * 12 + 8),
    );
  for (const i of [0, 64, 2112, 4160, 4224]) {
    const p = position(i);
    assert.ok(p.length() <= tile.boundingVolume.sphere[3]);
    p.set(p.x, -p.z, p.y);
    p.applyMatrix4(world);
    const lon = (Math.atan2(p.y, p.x) * 180) / Math.PI,
      lat = (Math.asin(p.z / p.length()) * 180) / Math.PI;
    // Tiny float32 errors may land exactly on the regional edge: inset lookup by <1 cm.
    const value = regionalElevation(
      grid,
      Math.max(-121.98 + 1e-8, Math.min(-121.55 - 1e-8, lon)),
      Math.max(46.72 + 1e-8, Math.min(47 - 1e-8, lat)),
    );
    assert.ok(
      Math.abs(p.length() - 6371000 - value) < 1,
      'tile transform preserves source elevation within 1 m',
    );
  }
  for (const child of tile.children ?? [])
    check(child, world, tile.geometricError);
}
check(tileset.root, new Matrix4());
assert.equal(count, 85);
assert.equal(levels.size, 4);
assert.equal(cameraMode(1), 'Globe');
assert.equal(cameraMode(10), 'Map');
assert.equal(cameraMode(400), 'Orbit');
assert.equal(cameraTilt(1, 35), 0);
assert.equal(cameraHeading(1, 90), 0);
assert.equal(cameraHeading(2.5, 90), 45);
assert.equal(cameraHeading(4, 90), 90);
assert.ok(
  Math.abs(cameraTilt(300 - 1e-5, 35) - cameraTilt(300 + 1e-5, 35)) < 1e-6,
);
assert.ok(panAnchor(0, 0, 100, 0, 100, 0).lon < 0);
assert.ok(Math.abs(panAnchor(0, 0, 100, 0, 100, 90).lon) < 1e-9);
assert.ok(panAnchor(0, 0, 100, 0, 100, 90).lat > 0);
console.log(
  'PASS terrain: original/derived hashes, 85 valid GLBs, four LOD levels, source elevations in transformed geometry, regional bounds and continuous navigation',
);
