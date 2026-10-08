#!/usr/bin/env node
// Large files live on the shared Box folder "2026 Realtime Weather", outside git.
// Each sketch lists what it uses in sketches/NN-name/assets.json.
//
//   node scripts/assets.mjs where                      which Box folder this machine uses
//   node scripts/assets.mjs list                       every sketch and its shared items
//   node scripts/assets.mjs check [NN]                 are the items on Box, are they copied locally
//   node scripts/assets.mjs pull NN [--all]            copy required (or all) items into sketches/NN-name/assets/
//   node scripts/assets.mjs add NN <path> [--id name] [--required] [--about "text"]
//                                                      MOVE a local file or folder onto Box under
//                                                      02 Sketch Assets/NN-name/ and record it in assets.json
//
// The Box folder is found in this order: WC_ASSETS, ~/Box/2026 Realtime Weather (Box Drive on Windows),
// ~/Library/CloudStorage/Box-Box/2026 Realtime Weather (Box Drive on macOS).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const BOX_NAME = '2026 Realtime Weather';
const SKETCH_ASSETS = '02 Sketch Assets';
const CANDIDATES = [
  process.env.WC_ASSETS,
  path.join(os.homedir(), 'Box', BOX_NAME),
  path.join(os.homedir(), 'Library', 'CloudStorage', 'Box-Box', BOX_NAME),
].filter(Boolean);
const ROOT = CANDIDATES.find((p) => fs.existsSync(p)) || null;

const sketches = () =>
  fs.readdirSync(SKETCHES, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => d.name).sort();

function find(arg) {
  const all = sketches();
  const hit = all.filter((n) => n === arg || n.startsWith(String(arg).padStart(2, '0') + '-'));
  if (hit.length !== 1) { console.error(`No single sketch matches "${arg}". Sketches: ${all.join(', ')}`); process.exit(1); }
  return hit[0];
}

const manifestPath = (name) => path.join(SKETCHES, name, 'assets.json');
function manifest(name) {
  const f = manifestPath(name);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { sketch: name, items: [] };
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

function needRoot() {
  if (ROOT) return ROOT;
  console.error(`The Box folder "${BOX_NAME}" was not found. Looked in:\n  ${CANDIDATES.join('\n  ')}\n` +
    `Install Box Drive and make sure the folder is shared with you, or set WC_ASSETS to where it syncs.`);
  process.exit(1);
}

function check(name) {
  const m = manifest(name);
  let ok = true;
  console.log(name);
  if (!m.items.length) console.log('  no shared assets');
  for (const it of m.items) {
    const src = ROOT ? size(path.join(ROOT, it.src)) : null;
    const dst = it.dest ? size(path.join(SKETCHES, name, it.dest)) : null;
    const s = !ROOT ? 'Box folder not found' : src ? `${src.files} files, ${mb(src.bytes)} on Box` : 'MISSING on Box';
    const d = !it.dest ? 'reference only' : dst ? `copied here (${dst.files} files)` : 'not copied here';
    if (it.required && (!src || !dst)) ok = false;
    console.log(`  ${it.id.padEnd(10)} ${(it.required ? 'required' : 'optional').padEnd(9)} ${s.padEnd(30)} ${d}\n             ${it.src}`);
  }
  return ok;
}

function pull(name, all) {
  const root = needRoot();
  for (const it of manifest(name).items) {
    if (!it.dest || (!it.required && !all)) continue;
    const src = path.join(root, it.src), dst = path.join(SKETCHES, name, it.dest);
    if (!fs.existsSync(src)) { console.error(`  ${it.id}: not on Box at ${src}`); if (it.required) process.exitCode = 1; continue; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.cpSync(src, dst, { recursive: true, force: false, errorOnExist: false });
    const s = size(dst);
    console.log(`  ${it.id}: ${s.files} files, ${mb(s.bytes)} → ${path.relative(REPO, dst)}`);
  }
}

function move(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  try { fs.renameSync(src, dst); }
  catch { fs.cpSync(src, dst, { recursive: true, errorOnExist: true, force: false }); fs.rmSync(src, { recursive: true, force: true }); }
}

function add(name, local, opts) {
  const root = needRoot();
  const abs = path.resolve(local);
  if (!fs.existsSync(abs)) { console.error(`Not found: ${abs}`); process.exit(1); }
  if (abs.startsWith(path.join(REPO, '.git'))) { console.error('Refusing to move files out of .git'); process.exit(1); }
  const base = path.basename(abs);
  const rel = [SKETCH_ASSETS, name, base].join('/');
  const dst = path.join(root, SKETCH_ASSETS, name, base);
  if (fs.existsSync(dst)) { console.error(`Already on Box: ${dst}\nRename the local copy or remove the Box copy first.`); process.exit(1); }
  const s = size(abs);
  move(abs, dst);
  const m = manifest(name);
  const id = opts.id || base.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (m.items.some((i) => i.id === id)) { console.error(`assets.json already has an item "${id}"; pass --id`); process.exit(1); }
  m.items.push({ id, src: rel, dest: `assets/${base}`, required: !!opts.required, files: s.files, bytes: s.bytes, about: opts.about || 'Describe what this is, where it came from and how it was made.' });
  fs.writeFileSync(manifestPath(name), JSON.stringify(m, null, 2) + '\n');
  console.log(`Moved ${s.files} files (${mb(s.bytes)}) to Box: ${rel}\nRecorded as "${id}" in sketches/${name}/assets.json. Run "pull ${name.slice(0, 2)}${opts.required ? '' : ' --all'}" to get a local copy.`);
}

const args = process.argv.slice(2);
const flag = (k) => { const i = args.indexOf('--' + k); if (i < 0) return undefined; const v = args[i + 1]; const isVal = v !== undefined && !v.startsWith('--'); args.splice(i, isVal ? 2 : 1); return isVal ? v : true; };
const all = flag('all'), required = flag('required'), id = flag('id'), about = flag('about');
const [cmd, arg, local] = args;

if (cmd === 'where') {
  console.log(ROOT ? `Box folder: ${ROOT}` : `Box folder not found. Looked in:\n  ${CANDIDATES.join('\n  ')}`);
} else if (cmd === 'list') {
  for (const n of sketches()) { const m = manifest(n); console.log(`${n.padEnd(36)} ${m.items.length} shared item(s), ${m.items.filter((i) => i.required).length} required`); }
} else if (cmd === 'check') {
  console.log(`Box folder: ${ROOT || 'not found'}\n`);
  const ok = (arg ? [find(arg)] : sketches()).map(check).every(Boolean);
  process.exitCode = ok ? 0 : 1;
} else if (cmd === 'pull' && arg) {
  pull(find(arg), !!all);
} else if (cmd === 'add' && arg && local) {
  add(find(arg), local, { id, required, about });
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 15).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
}
