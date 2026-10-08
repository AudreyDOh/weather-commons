# Working in this repository

Three systems, three jobs:

- **GitHub (this repository)** holds code and the small data each sketch needs to run.
- **Box, "2026 Realtime Weather"** holds everything large, raw, licensed or finished: downloads, dossiers, renders, video, working files, fonts.
- **A sketch folder** `sketches/NN-name/` is the unit of work: one idea, self-contained, with a README and an `assets.json` that connects it to Box.

## 1. Set up once

1. Clone the repository and install Node 22 or newer. Sketch 01 also needs pnpm (`corepack enable`).
2. Install Box Drive and accept the share of **2026 Realtime Weather**.
3. Run `node scripts/assets.mjs where`. It looks for the Box folder in `WC_ASSETS`, then `~/Box/2026 Realtime Weather` (Windows), then `~/Library/CloudStorage/Box-Box/2026 Realtime Weather` (macOS). If yours is elsewhere, set `WC_ASSETS` to it.

## 2. New sketch or new version?

- **Same idea, better** (tuning, a new control, a fix, more data for the same question): keep working in the same folder. Git history holds the versions; update the README's Status line (`v0.3`).
- **Different idea, site, method or audience**: start a new sketch. If it grows out of an existing one, write `Forked from 02 on 2026-10-20` in its README.

```bash
node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --author "Your Name" --stack "Vite + three.js"
```

This takes the next number, creates `sketches/03-cloud-seeding-over-the-sierra/` with `README.md` and `assets.json`, and adds a row to the root README.

Naming: two-digit number, then lowercase words joined by hyphens that name the site or idea (`02-haida-witness-composite`, never `test2` or `new-model`). Numbers only go up. Never renumber or reuse one, even for a retired sketch; notes, links and Box folders point at these names.

Everything a sketch needs to run is inside its folder: its own `package.json` and lock file, its own data, its own fonts list. Sketches may copy from one another but never import across folders, so any sketch keeps working when another one changes.

## 3. Where does this file go?

| The file is… | Put it in | Notes |
| --- | --- | --- |
| code, configs, lock files, scripts | git, in the sketch | |
| small data the sketch reads at run time (JSON, GeoJSON, CSV, small rasters) | git, in the sketch | under 10 MB per file, about 50 MB per sketch |
| a derived image, tile set or mesh the sketch displays | git, in the sketch, if each file is under 10 MB | keep the script that made it in `tools/` |
| raw downloads you can re-fetch | Box, `02 Sketch Assets/NN-name/` | keep the fetch script in git |
| anything over 10 MB the sketch must have to run | Box, `02 Sketch Assets/NN-name/`, `"required": true` | collaborators run `pull NN` |
| research: readings, news, PDFs, dossiers | Box, `01 Geoengineering Events, Technologies, Sites/` | reference from `assets.json` with `"dest": null` if a sketch relies on it |
| renders, prints, video, audio | Box, `03 Renders/` | |
| Photoshop, Affinity, Blender, Rhino, InDesign working files | Box | the root `.gitignore` blocks these types |
| licensed fonts (ABC Diatype …) | Box, `02 Sketch Assets/_shared/fonts/` | never in git; pages load them from `assets/fonts/` with a system fallback |
| passwords, API keys, `.env` | nowhere shared | use `.env.example` with blank values |

`scripts/check-sizes.mjs` fails any push that tracks a file over 10 MB, and warns when a sketch passes 50 MB. The root `.gitignore` blocks common heavy or licensed types (psd, afdesign, blend, mov, mp4, zip, otf, woff, woff2 …). If a small file of such a type truly belongs in a sketch, for example an open-licence web font, add it with `git add -f` and say why in the commit message.

## 4. Putting a large file on Box

From the repository root:

```bash
node scripts/assets.mjs add 03 ~/Downloads/nexrad --required --about "NEXRAD level II, KRGX, 12–15 Jan 2026; fetched with tools/fetch_radar.py"
git add sketches/03-cloud-seeding-over-the-sierra/assets.json && git commit -m "03: radar archive on Box"
```

`add` **moves** the file or folder (no duplicate is left behind) to `02 Sketch Assets/03-cloud-seeding-over-the-sierra/nexrad` on Box and appends an entry to the sketch's `assets.json`:

```json
{ "id": "nexrad", "src": "02 Sketch Assets/03-cloud-seeding-over-the-sierra/nexrad", "dest": "assets/nexrad",
  "required": true, "files": 412, "bytes": 4400000000, "about": "NEXRAD level II, KRGX, 12–15 Jan 2026; …" }
```

`src` is relative to the Box folder; `dest` is where `pull` copies it inside the sketch (`null` for reference material the sketch never reads). You can also drag files into Box by hand and write the entry yourself.

On Box: keep one folder per sketch named exactly like the sketch folder in git; do not rename or reorganise folders that an `assets.json` points to without updating that file in the same commit. `00`, `01` and `03` hold material that is not tied to one sketch.

## 5. Getting a sketch's files

```bash
node scripts/assets.mjs check 02        # what it expects, what is on Box, what you have
node scripts/assets.mjs pull 02         # required items only
node scripts/assets.mjs pull 02 --all   # optional items too
```

Files land in `sketches/02-…/assets/`, which git ignores. The sketch reads them from there. A sketch never reads from the Box path directly at run time: paths differ between computers and Box streams files on demand.

## 6. README header

The first lines of every sketch README feed the index in the root README:

```
# 03 · Cloud seeding over the Sierra

Author: Name · Started: 2026-10-20 · Status: sketch · Stack: Vite + three.js

One paragraph: what it shows and the question it asks. The first sentence becomes the summary in the index.
```

Then: how to run it, what is on screen, the files, and **Sources and limits** (producer, date, licence, and whether each layer is observed, reanalysed, modelled, synthetic or interpretive). After editing a header run `node scripts/index-sketches.mjs`; CI fails if the index is out of date. Status values: `sketch`, `pilot`, `v0.2` …, `retired`.

## 7. Commits, branches, checks

- Work on `main` for your own sketch with small commits whose message starts with the sketch number: `02: refine cells where the water is active`.
- Changes outside your sketch (root files, `scripts/`, someone else's sketch) go through a short branch and a pull request.
- Before pushing: the sketch's own checks (for 01: `pnpm check`, `pnpm lint`, `pnpm build` inside its folder), then `node scripts/check-sizes.mjs`.
- GitHub Actions run the size and index checks on every push and pull request.
- Windows: Git may convert line endings on checkout. For data whose hashes are recorded, add a `.gitattributes` in the sketch marking it `-text` (see `sketches/01-realtime-weather-pilot/.gitattributes`).

## 8. Retiring a sketch

Leave it in place, set `Status: retired` in its README header, run the index script and say in the README what replaced it. Its Box folder stays.
