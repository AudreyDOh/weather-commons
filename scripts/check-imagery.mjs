import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const manifest = JSON.parse(
  await fs.readFile('public/data/imagery/manifest.json', 'utf8'),
);
assert.equal(manifest.frames.length, 6, 'Keep decoded image memory bounded');
const hashes = new Set();
let previous = 0;
for (const frame of manifest.frames) {
  assert.match(frame.path, /^\/data\/imagery\/\d{4}-\d{2}-\d{2}\.png$/);
  const bytes = await fs.readFile('public' + frame.path);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), manifest.width);
  assert.equal(bytes.readUInt32BE(20), manifest.height);
  assert.equal(bytes[25], 6, 'RGBA PNG retains the source coverage mask');
  assert.equal(bytes.length, frame.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), frame.sha256);
  hashes.add(frame.sha256);
  const request = new URL(frame.url);
  assert.equal(request.origin, 'https://gibs.earthdata.nasa.gov');
  assert.equal(request.searchParams.get('TIME'), frame.date);
  assert.equal(request.searchParams.get('SRS'), manifest.crs);
  assert.equal(request.searchParams.get('BBOX'), manifest.bounds.join(','));
  assert.equal(request.searchParams.get('LAYERS'), manifest.layer);
  const time = Date.parse(frame.date + 'T00:00:00Z');
  if (previous)
    assert.equal(time - previous, 86400000, 'Consecutive daily frames');
  previous = time;
}
assert.equal(
  hashes.size,
  manifest.frames.length,
  'Distinct observations on every date',
);
console.log(
  'PASS six dated RGBA satellite frames: dimensions, source coordinates, daily cadence and SHA-256 integrity',
);
