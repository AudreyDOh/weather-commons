#!/usr/bin/env node
// Rebuild the sketch table in the root README from each sketch's README header:
//   # NN · Title
//   Author: … · Started: … · Status: … · Stack: …
//   first paragraph = summary
//
//   node scripts/index-sketches.mjs           rewrite README.md
//   node scripts/index-sketches.mjs --check   exit 1 if README.md is out of date (used in CI)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const START = '<!-- sketches:start -->', END = '<!-- sketches:end -->';

export function read(name) {
  const f = path.join(SKETCHES, name, 'README.md');
  const md = fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n') : '';
  const lines = md.split('\n');
  const title = (lines.find((l) => l.startsWith('# ')) || `# ${name}`).slice(2).replace(/^\d{2}\s*·\s*/, '').trim();
  const meta = {};
  const metaLine = lines.find((l) => /^Author:/.test(l)) || '';
  for (const part of metaLine.split('·')) { const m = part.match(/^\s*(\w+):\s*(.+?)\s*$/); if (m) meta[m[1].toLowerCase()] = m[2]; }
  const body = md.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#') && !p.startsWith('Author:') && !p.startsWith('```') && !p.startsWith('|') && !p.startsWith('-'));
  let summary = (body[0] || '').replace(/\s+/g, ' ');
  const dot = summary.search(/[.!?](\s|$)/);
  if (dot > 0) summary = summary.slice(0, dot + 1);
  return { name, nn: name.slice(0, 2), title, ...meta, summary };
}

export function table() {
  const rows = fs.readdirSync(SKETCHES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => read(d.name)).sort((a, b) => a.name.localeCompare(b.name));
  const esc = (s) => String(s || '').replace(/\|/g, '\\|');
  return ['| No. | Sketch | Author | Status | Stack | What it is |', '| --- | --- | --- | --- | --- | --- |',
    ...rows.map((r) => `| ${r.nn} | [${esc(r.title)}](sketches/${r.name}/) | ${esc(r.author)} | ${esc(r.status)} | ${esc(r.stack)} | ${esc(r.summary)} |`)].join('\n');
}

export function writeIndex(check = false) {
  const f = path.join(REPO, 'README.md');
  const md = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  const a = md.indexOf(START), b = md.indexOf(END);
  if (a < 0 || b < 0) throw new Error('README.md is missing the sketches:start / sketches:end markers');
  const next = md.slice(0, a + START.length) + '\n' + table() + '\n' + md.slice(b);
  if (check) return next === md;
  fs.writeFileSync(f, next);
  return true;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const check = process.argv.includes('--check');
  const ok = writeIndex(check);
  if (check && !ok) { console.error('README.md sketch index is out of date: run node scripts/index-sketches.mjs'); process.exit(1); }
  if (!check) console.log('README.md index updated');
}
