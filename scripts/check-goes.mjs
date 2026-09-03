import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const manifest = JSON.parse(
  await fs.readFile('public/data/archive/goes/manifest.json', 'utf8'),
);
assert.equal(manifest.products.length, 5);
const timeLists = [];
for (const product of manifest.products) {
  assert.equal(product.frames.length, product.id === 'winds' ? 1 : 12);
  const hashes = new Set();
  for (let index = 0; index < product.frames.length; index++) {
    const frame = product.frames[index];
    assert.match(
      frame.file,
      /^\/data\/archive\/goes\/\d{11}_GOES19-ABI-FD-[\w]+-1808x1808\.jpg$/,
    );
    const bytes = await fs.readFile('public' + frame.file);
    assert.equal(bytes.subarray(0, 2).toString('hex'), 'ffd8');
    assert.equal(bytes.length, frame.bytes);
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      frame.sha256,
    );
    const url = new URL(frame.url);
    assert.equal(url.origin, 'https://cdn.star.nesdis.noaa.gov');
    assert.ok(url.pathname.includes(`/GOES19/ABI/FD/${product.folder}/`));
    const stamp = url.pathname.split('/').at(-1).slice(0, 11);
    const timestamp = new Date(
      Date.UTC(
        Number(stamp.slice(0, 4)),
        0,
        Number(stamp.slice(4, 7)),
        Number(stamp.slice(7, 9)),
        Number(stamp.slice(9, 11)),
      ),
    ).toISOString();
    assert.equal(
      timestamp,
      frame.time,
      'Julian source date matches displayed acquisition time',
    );
    if (index)
      assert.equal(
        Date.parse(frame.time) - Date.parse(product.frames[index - 1].time),
        600000,
      );
    hashes.add(frame.sha256);
  }
  assert.equal(hashes.size, product.frames.length, 'Distinct source images');
  if (product.id !== 'winds')
    timeLists.push(product.frames.map((frame) => frame.time));
}
for (const times of timeLists)
  assert.deepEqual(
    times,
    timeLists[0],
    'Side-by-side products share acquisition labels',
  );
assert.equal(timeLists[0][0], manifest.start);
assert.equal(timeLists[0].at(-1), manifest.end);
console.log(
  'PASS GOES: 49 original JPEGs, SHA-256 integrity, source names, ten-minute cadence and matched product times',
);
