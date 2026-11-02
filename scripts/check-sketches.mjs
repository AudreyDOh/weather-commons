#!/usr/bin/env node
// Check every sketch the way a reviewer would, with messages a beginner can act on:
//   - each sketches/NN-name/ has a README.md that starts with the header and has a "Sources and limits" section
//   - no two sketches share a number
//   - web pages load their own files with relative paths, so they work on the published site
//
//   node scripts/check-sketches.mjs        exit 1 if anything needs fixing (used in CI)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const SKIP = new Set(['assets', 'tools', 'node_modules', 'dist', '.vite', '.wrangler', 'public']);
const problems = [];
const say = (name, msg) => problems.push(`sketches/${name}/: ${msg}`);

const names = fs.readdirSync(SKETCHES, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => d.name).sort();

const byNumber = {};
for (const n of names) (byNumber[n.slice(0, 2)] ??= []).push(n);
for (const [nn, list] of Object.entries(byNumber)) {
  if (list.length > 1) problems.push(`Two sketches use number ${nn}: ${list.join(', ')}. Each sketch needs its own number; ask a facilitator for a free one.`);
}

function webFiles(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...webFiles(p));
    else if (/\.(html|js|css)$/.test(e.name)) out.push(p);
  }
  return out;
}

for (const name of names) {
  const dir = path.join(SKETCHES, name);
  const readme = path.join(dir, 'README.md');
  if (!fs.existsSync(readme)) { say(name, 'add a README.md (copy the one in sketches/_template/).'); continue; }
  const md = fs.readFileSync(readme, 'utf8').replace(/\r\n/g, '\n');
  const lines = md.split('\n');
  if (!new RegExp(`^# ${name.slice(0, 2)} · `).test(lines[0] ?? '')) say(name, `README.md should start with "# ${name.slice(0, 2)} · Title".`);
  if (!lines.some((l) => /^Author: .+ · Started: .+ · Status: .+ · Stack: .+/.test(l))) say(name, 'README.md needs the line "Author: … · Started: … · Status: … · Stack: …" under the title.');
  if (!/^##\s+Sources and limits/m.test(md)) say(name, 'README.md needs a "## Sources and limits" section: where each dataset comes from and what the sketch cannot show.');

  // Root-relative links break under /weather-commons/NN-name/. Sketch 01 handles its own (see its AGENTS.md).
  if (fs.existsSync(path.join(dir, 'package.json'))) continue;
  for (const f of webFiles(dir)) {
    const text = fs.readFileSync(f, 'utf8');
    const hits = [...text.matchAll(/(?:\b(?:src|href)\s*=\s*["']|fetch\(\s*["'`]|url\(\s*["']?)(\/(?!\/)[^"'`)\s]*)/g)].map((m) => m[1]);
    for (const h of new Set(hits)) say(name, `${path.relative(dir, f)} loads "${h}" from the site root. Use a relative path ("${h.slice(1)}") so it works once published.`);
  }
}

if (problems.length) {
  console.error(`Some sketches need a fix before they can be published:\n\n- ${problems.join('\n- ')}\n`);
  process.exit(1);
}
console.log(`ok: ${names.length} sketches checked`);
