# Weather Commons

Sketches, models and pilots for the Weather Commons working group (Realtime Urbanism Lab, Cornell AAP): weather modification, atmospheric data and the governance of the sky, explored as small browser-based instruments.

**Open them in a browser:** https://realtimeurbanismlab.github.io/weather-commons/ (rebuilt from `main` on every push).

## Sketches

<!-- sketches:start -->
| No. | Sketch | Author | Status | Stack | What it is |
| --- | --- | --- | --- | --- | --- |
| 01 | [Realtime Weather](sketches/01-realtime-weather-pilot/) | Farzin Lotfi-Jam | pilot | vinext (Next on Vite) + React + three.js, Cloudflare | An evidence-led technical pilot for the Weather Commons working group. |
| 02 | [Haida witness composite](sketches/02-haida-witness-composite/) | Boone Mercado (with Claude) | sketch, v0.2 | static HTML + JS, no build step | A layered model of the 2012 Haida Gwaii iron dump. |
<!-- sketches:end -->

The table is generated from each sketch's README header by `node scripts/index-sketches.mjs`.

## Where things live

| What | Where | How |
| --- | --- | --- |
| Code, configs, small data and small images a sketch needs to run (every file under 10 MB) | this repository, inside the sketch's folder `sketches/NN-name/` | git |
| Raw downloads, research dossiers, renders, video, working files, licensed fonts, anything over 10 MB | Box folder **2026 Realtime Weather** | listed in the sketch's `assets.json`, moved and copied with `scripts/assets.mjs` |
| A new idea, site or method | a new numbered folder `sketches/NN-name/` | `node scripts/new-sketch.mjs` |

Each sketch runs from its own folder and its own files. A sketch never reads from Box while it runs: if it needs a large file, `node scripts/assets.mjs pull NN` copies it into `sketches/NN-name/assets/` (ignored by git) and the sketch reads it there.

The Box folder is shared with lab members only. Everything the published sketches need to run is in this repository, so you can clone and run them without Box. Box holds raw downloads (to rebuild derived data), licensed fonts (pages fall back to system fonts), research dossiers and renders.

## Getting started

1. Clone this repository. Install Node 22 or newer (and pnpm for sketch 01: `corepack enable`, or run it as `corepack pnpm`).
2. Open a sketch's README and follow its Run section.
3. Lab members only, to work with the large files: install [Box Drive](https://www.box.com/drive) and make sure the folder **2026 Realtime Weather** is shared with you. Check that the scripts find it: `node scripts/assets.mjs where`. If it syncs somewhere else (for example under `~/Box/Realtime Urbanism Lab/Projects/`), set the environment variable `WC_ASSETS` to that folder. Then `node scripts/assets.mjs pull NN --all` copies a sketch's Box files into its `assets/` folder.

## Common tasks

```bash
node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --author "Your Name" --stack "Vite + three.js"
                                              # start sketch NN+1 with a README and assets.json
node scripts/assets.mjs add 03 ~/Downloads/nexrad --about "NEXRAD level II, 12–15 Jan 2026"
                                              # MOVE a big file or folder onto Box and record it
node scripts/assets.mjs pull 03 --all         # copy a sketch's Box files into sketches/03-…/assets/
node scripts/assets.mjs check                 # what every sketch expects from Box, and what you have
node scripts/check-sizes.mjs                  # no tracked file over 10 MB (also runs on GitHub)
node scripts/index-sketches.mjs               # refresh the table above after editing a README header
node scripts/build-pages.mjs                  # build the public site into _site/ (GitHub Actions does this on push)
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) before adding work. Coding agents read [AGENTS.md](AGENTS.md) (Claude Code loads it through [CLAUDE.md](CLAUDE.md)).

## Layout

```
sketches/
  01-realtime-weather-pilot/     one folder per sketch: README.md, assets.json, its own package.json if any
  02-haida-witness-composite/
  …
scripts/                         new-sketch, index-sketches, assets, check-sizes, build-pages (Node, no dependencies)
.github/workflows/               size and index checks on every push and pull request; GitHub Pages deploy
```

Box, **2026 Realtime Weather**:

```
00 Presentations/
01 Geoengineering Events, Technologies, Sites/   research dossiers: 01 Geoengineering (12 sites), 02 Rituals (12 rituals)
02 Sketch Assets/                                one folder per sketch, named exactly as in git
  _shared/fonts/                                 licensed fonts (ABC Diatype), never in git
  02-haida-witness-composite/
03 Renders/                                      finished renders, prints and video
```

## Hosting

The repository is public. On every push to `main` that touches a sketch, `.github/workflows/pages.yml` runs `scripts/build-pages.mjs` and deploys the result to GitHub Pages: a landing page plus one folder per sketch listed in `PUBLISHED` in that script (01 and 02 so far). A new sketch goes online only once it is added there. Box files are never part of the site.

`01-realtime-weather-pilot` moved from the repository root into its folder on 2026-10-08, unchanged. Any other hosting or build service connected to this repository must use `sketches/01-realtime-weather-pilot` as its root directory.
