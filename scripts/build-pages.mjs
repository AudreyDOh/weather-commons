#!/usr/bin/env node
// Build the public GitHub Pages site: one folder per published sketch plus a landing page.
// Only the sketches listed in PUBLISHED go online; Box files are never part of the site.
//
//   node scripts/build-pages.mjs                  build into _site/ for https://<owner>.github.io/weather-commons/
//   node scripts/build-pages.mjs --base /x        serve under another path ('' for a domain root)
//   node scripts/build-pages.mjs --skip-build     reuse an existing sketch build (dist/)
//
// Check locally: put _site/ at <dir><base>/ and serve <dir>, e.g. python -m http.server -d <dir>.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { read } from './index-sketches.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKETCHES = path.join(REPO, 'sketches');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const BASE = opt('base', '/weather-commons').replace(/\/$/, '');
const OUT = path.resolve(REPO, opt('out', '_site'));
const SKIP_BUILD = args.includes('--skip-build');
const REPO_URL = 'https://github.com/RealtimeUrbanismLab/weather-commons';

function run(cmd, cmdArgs, cwd, env = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`Failed: ${cmd} ${cmdArgs.join(' ')} (in ${path.relative(REPO, cwd)})`); process.exit(1); }
}
const copy = (from, to) => fs.cpSync(from, to, { recursive: true });

// How each published sketch becomes static files in <OUT>/<name>/.
const PUBLISHED = {
  // vinext static export. It writes _next/ under dist/client<prefix>/ and public/ files at dist/client/.
  '01-realtime-weather-pilot'(dir, out, prefix) {
    if (!SKIP_BUILD) {
      if (!fs.existsSync(path.join(dir, 'node_modules'))) run('corepack', ['pnpm', 'install', '--frozen-lockfile'], dir);
      run('corepack', ['pnpm', 'build'], dir, { STATIC_EXPORT: '1', NEXT_PUBLIC_BASE_PATH: prefix });
    }
    const client = path.join(dir, 'dist', 'client');
    if (!fs.existsSync(path.join(client, 'index.html'))) { console.error('No dist/client/index.html: build with STATIC_EXPORT=1'); process.exit(1); }
    const skip = new Set(['.vite', '_headers', '.assetsignore', prefix.split('/').filter(Boolean)[0] ?? '']);
    for (const e of fs.readdirSync(client)) if (!skip.has(e)) copy(path.join(client, e), path.join(out, e));
    copy(path.join(client, ...prefix.split('/').filter(Boolean)), out);
  },
  // Static page; tools/ and assets/ (Box copies, licensed fonts) stay out.
  '02-haida-witness-composite'(dir, out) {
    for (const f of ['index.html', 'app.js', 'cal']) copy(path.join(dir, f), path.join(out, f));
  },
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function landing(sketches) {
  const items = sketches.map((s) => `    <li>
      <a href="${esc(s.name)}/"><span class="nn">${esc(s.nn)}</span> ${esc(s.title)}</a>
      <p>${esc(s.summary)}</p>
      <p class="meta">${esc(s.author)} · ${esc(s.status)} · <a href="${REPO_URL}/tree/main/sketches/${esc(s.name)}">source and sources</a></p>
    </li>`).join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weather Commons</title>
<style>
  :root { color-scheme: light dark; --bg: #faf9f6; --fg: #111; --muted: #666; }
  @media (prefers-color-scheme: dark) { :root { --bg: #111; --fg: #eee; --muted: #999; } }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, sans-serif; }
  main { max-width: 44rem; margin: 0 auto; padding: 3rem 1rem; }
  h1 { font-weight: 400; font-size: 1.75rem; margin: 0 0 .5rem; }
  ul { list-style: none; padding: 0; margin: 2.5rem 0; }
  li { border-top: 1px solid currentColor; padding: 1rem 0 1.5rem; }
  li > a { font-size: 1.25rem; color: inherit; }
  .nn { color: var(--muted); margin-right: .5rem; }
  p { margin: .5rem 0 0; }
  .meta, footer { color: var(--muted); font-size: .875rem; }
  .meta a, footer a { color: inherit; }
</style>
</head>
<body>
<main>
  <h1>Weather Commons</h1>
  <p>Sketches, models and pilots for the Weather Commons working group (Realtime Urbanism Lab, Cornell AAP): weather modification, atmospheric data and the governance of the sky, explored as small browser-based instruments.</p>
  <ul>
${items}
  </ul>
  <footer>Each sketch states its sources and which layers are observed, reanalysed, modelled, synthetic or interpretive. Code: <a href="${REPO_URL}">${REPO_URL.replace('https://', '')}</a></footer>
</main>
</body>
</html>
`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const built = [];
for (const [name, build] of Object.entries(PUBLISHED)) {
  const dir = path.join(SKETCHES, name);
  if (!fs.existsSync(dir)) { console.error(`Listed in PUBLISHED but missing: sketches/${name}`); process.exit(1); }
  console.log(`\n${name}`);
  build(dir, path.join(OUT, name), `${BASE}/${name}`);
  built.push(read(name));
}
fs.writeFileSync(path.join(OUT, 'index.html'), landing(built));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`\nSite in ${path.relative(REPO, OUT)}/ for ${BASE || '/'}: ${built.map((s) => s.name).join(', ')}`);
