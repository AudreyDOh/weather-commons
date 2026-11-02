#!/usr/bin/env node
// Build the public GitHub Pages site: a landing page, the guide and catalog pages, and one
// folder per sketch. Box files and assets/ folders are never part of the site.
//
//   node scripts/build-pages.mjs                  build into _site/ for https://<owner>.github.io/weather-commons/
//   node scripts/build-pages.mjs --base /x        serve under another path ('' for a domain root)
//   node scripts/build-pages.mjs --out <dir>      write somewhere else
//   node scripts/build-pages.mjs --skip-build     reuse existing sketch builds (dist/)
//
// Which sketches go online: every sketches/NN-name/ with an index.html (copied as is), or with a
// "build:pages" npm script (run, then dist/ copied), or with an entry in CUSTOM below.
// Add "Publish: no" to a README header to keep a sketch off the site.
//
// Check locally: build with --out <dir>/weather-commons, serve <dir> (python -m http.server -d <dir>),
// open http://localhost:8000/weather-commons/.
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
const UPSTREAM = 'RealtimeUrbanismLab/weather-commons';
const REPO_NAME = process.env.GITHUB_REPOSITORY || UPSTREAM; // a fork builds its own copy
const IS_FORK = REPO_NAME.toLowerCase() !== UPSTREAM.toLowerCase();
const SHARED_SITE = 'https://realtimeurbanismlab.github.io/weather-commons/';
const COMMUNITY = 'https://community.ocean-archive.org/spaces/25478985';
const SITE_PAGES = ['guide', 'catalog']; // root folders published as they are
const SKIP = new Set(['assets', 'tools', 'node_modules', 'dist', '.vite', '.wrangler']);

function run(cmd, cmdArgs, cwd, env = {}) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', shell: process.platform === 'win32', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`Failed: ${cmd} ${cmdArgs.join(' ')} (in ${path.relative(REPO, cwd)})`); process.exit(1); }
}
const copy = (from, to) => fs.cpSync(from, to, { recursive: true });
const copyFolder = (from, to) => {
  for (const e of fs.readdirSync(from)) if (!SKIP.has(e)) copy(path.join(from, e), path.join(to, e));
};
const pnpm = (dir, script, env) => {
  if (!fs.existsSync(path.join(dir, 'node_modules'))) run('corepack', ['pnpm', 'install', '--frozen-lockfile'], dir);
  run('corepack', ['pnpm', script], dir, env);
};

// Sketches that need more than a copy.
const CUSTOM = {
  // vinext static export. It writes _next/ under dist/client<prefix>/ and public/ files at dist/client/.
  '01-realtime-weather-pilot'(dir, out, prefix) {
    if (!SKIP_BUILD) pnpm(dir, 'build', { STATIC_EXPORT: '1', NEXT_PUBLIC_BASE_PATH: prefix });
    const client = path.join(dir, 'dist', 'client');
    if (!fs.existsSync(path.join(client, 'index.html'))) { console.error('No dist/client/index.html: build with STATIC_EXPORT=1'); process.exit(1); }
    const skip = new Set(['.vite', '_headers', '.assetsignore', prefix.split('/').filter(Boolean)[0] ?? '']);
    for (const e of fs.readdirSync(client)) if (!skip.has(e)) copy(path.join(client, e), path.join(out, e));
    copy(path.join(client, ...prefix.split('/').filter(Boolean)), out);
  },
};

// How a sketch becomes static files, or null if it has no web page.
function builder(name, dir) {
  if (CUSTOM[name]) return CUSTOM[name];
  const pkg = path.join(dir, 'package.json');
  if (fs.existsSync(pkg) && JSON.parse(fs.readFileSync(pkg, 'utf8')).scripts?.['build:pages']) {
    return (d, out, prefix) => { if (!SKIP_BUILD) pnpm(d, 'build:pages', { NEXT_PUBLIC_BASE_PATH: prefix, BASE_PATH: prefix }); copy(path.join(d, 'dist'), out); };
  }
  if (fs.existsSync(path.join(dir, 'index.html'))) return (d, out) => copyFolder(d, out);
  return null;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function landing(sketches, pages) {
  const repoUrl = `https://github.com/${REPO_NAME}`;
  const cards = sketches.map((s) => {
    const cover = ['cover.jpg', 'cover.png'].find((f) => fs.existsSync(path.join(SKETCHES, s.name, f)));
    return `    <li>
      <a class="card" href="${esc(s.name)}/">
        ${cover ? `<img src="${esc(s.name)}/${cover}" alt="" loading="lazy">` : ''}
        <span class="nn">${esc(s.nn)}</span>
        <span class="title">${esc(s.title)}</span>
        <span class="summary">${esc(s.summary)}</span>
      </a>
      <p class="meta">${esc(s.author)} · ${esc(s.status)} · <a href="${repoUrl}/tree/main/sketches/${esc(s.name)}">code and sources</a></p>
    </li>`;
  }).join('\n');
  const nav = [
    pages.includes('guide') && '<a href="guide/">Setup guide</a>',
    pages.includes('catalog') && '<a href="catalog/">Catalog</a>',
    `<a href="${repoUrl}/blob/main/CONTRIBUTING.md">Contribute</a>`,
    `<a href="${COMMUNITY}">Community</a>`,
  ].filter(Boolean).join('\n    ');
  const fork = IS_FORK ? `\n  <p class="note">This is ${esc(REPO_NAME.split('/')[0])}'s copy. The shared site is at <a href="${SHARED_SITE}">${SHARED_SITE.replace('https://', '')}</a>.</p>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weather Commons</title>
<style>
  :root { color-scheme: light dark; --bg: #fff; --fg: #000; --muted: #666; --line: #000; }
  @media (prefers-color-scheme: dark) { :root { --bg: #000; --fg: #fff; --muted: #999; --line: #fff; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; }
  main { max-width: 64rem; margin: 0 auto; padding: 2.5rem 1rem 4rem; }
  header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 1rem; border-bottom: 1px solid var(--line); padding-bottom: 1rem; }
  h1 { font-size: 2rem; font-weight: 600; letter-spacing: -.02em; margin: 0; text-transform: uppercase; }
  nav { display: flex; flex-wrap: wrap; gap: 1.25rem; }
  a { color: inherit; }
  nav a { text-decoration: none; text-transform: uppercase; font-size: .8125rem; letter-spacing: .04em; }
  nav a:hover { text-decoration: underline; }
  .intro { max-width: 40rem; margin: 1.5rem 0 0; }
  .note { border: 1px solid var(--line); padding: .5rem .75rem; margin: 1.5rem 0 0; font-size: .875rem; }
  ul { list-style: none; padding: 0; margin: 2.5rem 0 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr)); gap: 2rem 1.5rem; }
  .card { display: flex; flex-direction: column; gap: .25rem; text-decoration: none; border-top: 1px solid var(--line); padding-top: .75rem; }
  .card img { width: 100%; aspect-ratio: 3 / 2; object-fit: cover; filter: grayscale(1); margin-bottom: .5rem; }
  .card:hover .title { text-decoration: underline; }
  .nn { font-size: .8125rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .title { font-size: 1.25rem; font-weight: 600; line-height: 1.25; }
  .summary { font-size: .9375rem; }
  .meta { margin: .5rem 0 0; font-size: .8125rem; color: var(--muted); }
  footer { margin-top: 4rem; border-top: 1px solid var(--line); padding-top: 1rem; font-size: .8125rem; color: var(--muted); }
</style>
</head>
<body>
<main>
  <header>
    <h1>Weather Commons</h1>
    <nav>
    ${nav}
    </nav>
  </header>
  <p class="intro">Sketches from the Realtime Weather working group (Realtime Urbanism Lab, Cornell AAP, with TBA21–Academy UNI). How is weather monitored, modelled, managed and shown in real time, and who has the right to change it?</p>${fork}
  <ul>
${cards}
  </ul>
  <footer>Each sketch says where its data comes from and which parts are observed, modelled, synthetic or interpretive. Code: <a href="${repoUrl}">${esc(REPO_NAME)}</a></footer>
</main>
</body>
</html>
`;
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const built = [];
const names = fs.readdirSync(SKETCHES, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^\d{2}-/.test(d.name)).map((d) => d.name).sort();
for (const name of names) {
  const dir = path.join(SKETCHES, name);
  const info = read(name);
  if (/^no\b/i.test(info.publish ?? '')) { console.log(`\n${name}: Publish: no, skipped`); continue; }
  const build = builder(name, dir);
  if (!build) { console.log(`\n${name}: no index.html, skipped`); continue; }
  console.log(`\n${name}`);
  build(dir, path.join(OUT, name), `${BASE}/${name}`);
  built.push(info);
}
const pages = SITE_PAGES.filter((p) => fs.existsSync(path.join(REPO, p, 'index.html')));
for (const p of pages) copy(path.join(REPO, p), path.join(OUT, p));
fs.writeFileSync(path.join(OUT, 'index.html'), landing(built, pages));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
console.log(`\nSite in ${path.relative(REPO, OUT)}/ for ${BASE || '/'}: ${[...built.map((s) => s.name), ...pages].join(', ')}`);
