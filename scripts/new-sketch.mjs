#!/usr/bin/env node
// Start a new sketch from sketches/_template. It touches nothing outside the new folder, so pull
// requests from different people don't collide; maintainers refresh the README table after merging
// (node scripts/index-sketches.mjs). The site's landing page lists sketches automatically.
//
//   node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --number 12 --author "Your Name"
//   node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --author "Your Name" --stack "Vite + three.js"
//
// Creates sketches/NN-cloud-seeding-over-the-sierra/ with index.html, README.md, NOTES.md and assets.json.
// Workshop participants use the number the facilitators gave them (--number), so sketches made
// in different forks never collide. Without --number the next free number is used.
// Numbers only go up: never reuse or renumber, even when a sketch is retired.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const TEMPLATE = path.join(SKETCHES, '_template');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const author = opt('author', 'Name');
const stack = opt('stack', 'static HTML + JS');
const number = opt('number');
const title = args.join(' ').trim();
const fail = (msg) => { console.error(msg); process.exit(1); };
if (!title) fail('Usage: node scripts/new-sketch.mjs "Sketch name" --number NN --author "Your Name" [--stack "static HTML + JS"]');

const existing = fs.readdirSync(SKETCHES).filter((n) => /^\d{2}-/.test(n));
const used = existing.map((n) => parseInt(n, 10));
let nn;
if (number !== undefined) {
  const n = Number(number);
  if (!Number.isInteger(n) || n < 1 || n > 99) fail(`--number must be a whole number from 1 to 99, not "${number}".`);
  const taken = existing.find((e) => parseInt(e, 10) === n);
  if (taken) fail(`Number ${n} is already used by sketches/${taken}/. Ask a facilitator for your number.`);
  nn = String(n).padStart(2, '0');
} else {
  nn = String(Math.max(0, ...used) + 1).padStart(2, '0');
}
const slug = title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const name = `${nn}-${slug}`;
const dir = path.join(SKETCHES, name);
const today = new Date().toISOString().slice(0, 10);
const values = { NN: nn, TITLE: title, AUTHOR: author, STACK: stack, DATE: today, NAME: name };

fs.cpSync(TEMPLATE, dir, { recursive: true });
for (const e of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
  if (!e.isFile() || !/\.(html|md|json|js|css)$/.test(e.name)) continue;
  const f = path.join(e.parentPath ?? e.path, e.name);
  fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/\{\{(\w+)\}\}/g, (m, k) => values[k] ?? m));
}

console.log(`Created sketches/${name}/ from the template.
Open sketches/${name}/index.html to start. Your page will be at .../weather-commons/${name}/ once published.`);
