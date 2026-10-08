#!/usr/bin/env node
// Large files live on the shared drive, outside git. Each sketch lists them in its assets.json.
//
//   node scripts/assets.mjs list              every sketch and what it needs
//   node scripts/assets.mjs check 02          is the shared drive reachable, are the files there and copied
//   node scripts/assets.mjs pull 02           copy the sketch's items into its assets/ folder (gitignored)
//   node scripts/assets.mjs pull 02 --all     include optional items
//
// The shared root is WC_ASSETS, or ~/Box/2026 Realtime Weather (Box Drive) when unset.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const ROOT = process.env.WC_ASSETS || path.join(os.homedir(), 'Box', '2026 Realtime Weather');

const sketches = () =>
  fs.readdirSync(SKETCHES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name))
    .map((d) => d.name)
    .sort();

function find(arg) {
  const all = sketches();
  const hit = all.filter((n) => n === arg || n.startsWith(String(arg).padStart(2, '0') + '-'));
  if (hit.length !== 1) {
    console.error(`No single sketch matches "${arg}". Sketches: ${all.join(', ')}`);
    process.exit(1);
  }
  return hit[0];
}

function manifest(name) {
  const f = path.join(SKETCHES, name, 'assets.json');
  if (!fs.existsSync(f)) return { items: [] };
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

function size(p) {
  if (!fs.existsSync(p)) return null;
  const st = fs.statSync(p);
  if (!st.isDirectory()) return { files: 1, bytes: st.size };
  let files = 0, bytes = 0;
  for (const e of fs.readdirSync(p, { withFileTypes: true, recursive: true })) {
    if (e.isFile()) { files++; bytes += fs.statSync(path.join(e.parentPath ?? e.path, e.name)).size; }
  }
  return { files, bytes };
}

const mb = (b) => (b / 1048576).toFixed(1) + ' MB';

function check(name, quiet = false) {
  const m = manifest(name);
  let ok = true;
  if (!quiet) console.log(`${name}  (shared root: ${ROOT}${fs.existsSync(ROOT) ? '' : '  — NOT FOUND'})`);
  for (const it of m.items) {
    const src = size(path.join(ROOT, it.src));
    const dst = it.dest ? size(path.join(SKETCHES, name, it.dest)) : null;
    const need = it.required ? 'required' : 'optional';
    const s = src ? `${src.files} files, ${mb(src.bytes)}` : 'missing on shared drive';
    const d = !it.dest ? 'reference only' : dst ? `copied (${dst.files} files)` : 'not copied';
    if (it.required && !dst) ok = false;
    if (!quiet) console.log(`  ${it.id.padEnd(10)} ${need.padEnd(9)} ${s.padEnd(30)} ${d}\n             ${it.src}`);
  }
  if (!m.items.length && !quiet) console.log('  no shared assets');
  return ok;
}

function pull(name, all) {
  const m = manifest(name);
  for (const it of m.items) {
    if (!it.dest || (!it.required && !all)) continue;
    const src = path.join(ROOT, it.src), dst = path.join(SKETCHES, name, it.dest);
    if (!fs.existsSync(src)) { console.error(`  ${it.id}: not found at ${src}`); if (it.required) process.exitCode = 1; continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true, force: false, errorOnExist: false });
    const s = size(dst);
    console.log(`  ${it.id}: ${s.files} files, ${mb(s.bytes)} → ${path.relative(REPO, dst)}`);
  }
}

const [cmd, arg, flag] = process.argv.slice(2);
if (cmd === 'list') {
  for (const n of sketches()) {
    const m = manifest(n), req = m.items.filter((i) => i.required).length;
    console.log(`${n.padEnd(36)} ${m.items.length} shared item(s), ${req} required`);
  }
} else if (cmd === 'check' && arg) {
  process.exitCode = check(find(arg)) ? 0 : 1;
} else if (cmd === 'pull' && arg) {
  const n = find(arg);
  if (!fs.existsSync(ROOT)) { console.error(`Shared root not found: ${ROOT}\nSet WC_ASSETS to the synced "2026 Realtime Weather" folder.`); process.exit(1); }
  pull(n, flag === '--all');
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 9).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
}
