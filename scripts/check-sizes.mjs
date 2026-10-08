#!/usr/bin/env node
// Keep the repo light. Fails if a tracked file is over the per-file limit; warns when a sketch grows past
// its budget. Large files belong on the shared drive, listed in the sketch's assets.json.
//
//   node scripts/check-sizes.mjs            check tracked files (and staged ones)
//   node scripts/check-sizes.mjs --report   per-sketch sizes and the largest files
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const FILE_LIMIT = 10 * 1048576;      // GitHub warns at 50 MB and refuses 100 MB; we stop well before
const SKETCH_BUDGET = 50 * 1048576;   // soft budget per sketch
const ALLOW = [];                     // exact paths allowed over FILE_LIMIT, with a reason in the PR

const files = execSync('git ls-files -z --cached', { encoding: 'utf8', maxBuffer: 1 << 26 })
  .split('\0').filter(Boolean).filter((f) => fs.existsSync(f));
const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
const sizes = files.map((f) => ({ f, b: fs.statSync(f).size }));

const over = sizes.filter((s) => s.b > FILE_LIMIT && !ALLOW.includes(s.f));
const bySketch = new Map();
for (const s of sizes) {
  const m = s.f.match(/^sketches\/([^/]+)\//);
  const k = m ? m[1] : '(root)';
  bySketch.set(k, (bySketch.get(k) || 0) + s.b);
}

if (process.argv.includes('--report')) {
  for (const [k, b] of [...bySketch].sort()) console.log(`${mb(b).padStart(10)}  ${k}`);
  console.log('\nlargest files:');
  for (const s of sizes.sort((a, b) => b.b - a.b).slice(0, 15)) console.log(`${mb(s.b).padStart(10)}  ${s.f}`);
}
for (const [k, b] of bySketch) if (k !== '(root)' && b > SKETCH_BUDGET) console.warn(`warning: ${k} tracks ${mb(b)} (budget ${mb(SKETCH_BUDGET)}). Consider moving bulk data to the shared drive.`);
if (over.length) {
  console.error(`These files are over ${mb(FILE_LIMIT)}. Move them to the shared drive and list them in the sketch's assets.json:`);
  for (const s of over) console.error(`  ${mb(s.b).padStart(9)}  ${s.f}`);
  process.exit(1);
}
console.log(`ok: ${files.length} files, none over ${mb(FILE_LIMIT)}`);
