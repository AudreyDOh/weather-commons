#!/usr/bin/env node
// Start a new sketch with the next number, then refresh the index in the root README.
//
//   node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --author "Your Name" --stack "Vite + three.js"
//
// Creates sketches/NN-cloud-seeding-over-the-sierra/ with README.md and assets.json.
// Numbers only go up: never reuse or renumber, even when a sketch is retired.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeIndex } from './index-sketches.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const author = opt('author', 'Name');
const stack = opt('stack', 'static HTML + JS');
const title = args.join(' ').trim();
if (!title) { console.log('Usage: node scripts/new-sketch.mjs "Sketch name" [--author "Name"] [--stack "Vite + React"]'); process.exit(1); }

const used = fs.readdirSync(SKETCHES).map((n) => parseInt(n, 10)).filter(Number.isFinite);
const nn = String(Math.max(0, ...used) + 1).padStart(2, '0');
const slug = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const name = `${nn}-${slug}`;
const dir = path.join(SKETCHES, name);
fs.mkdirSync(dir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);

fs.writeFileSync(path.join(dir, 'README.md'), `# ${nn} · ${title}

Author: ${author} · Started: ${today} · Status: sketch · Stack: ${stack}

One paragraph: what this sketch shows, which site or phenomenon, and the question it asks.

## Run

\`\`\`bash
cd sketches/${name}
python -m http.server 8000
\`\`\`

Large files: \`node scripts/assets.mjs add ${nn} <path> --about "…"\` moves them to Box and records them in assets.json; \`node scripts/assets.mjs pull ${nn} --all\` copies them into \`assets/\` (ignored by git). See CONTRIBUTING.md.

## Sources and limits

Every dataset with its producer, date, licence and what it cannot show. Say which layers are observed, reanalysed, modelled, synthetic or interpretive.
`);

fs.writeFileSync(path.join(dir, 'NOTES.md'), `# Notes for the next version

Working notes for sketch ${nn}. Read this first. Dated entries; move items to Done when they ship.

## Observed

-

## Next

-

## Decisions

-

## Questions

-

## Done

-
`);

fs.writeFileSync(path.join(dir, 'assets.json'), JSON.stringify({
  sketch: name,
  note: 'Large, raw and licensed files live on Box (2026 Realtime Weather). Add them with: node scripts/assets.mjs add NN <path>. src is relative to the Box folder; dest is where pull copies them in this sketch.',
  items: [],
}, null, 2) + '\n');

writeIndex();
console.log(`Created sketches/${name}/ and updated the index in README.md`);
