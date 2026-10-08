# Working in this repository

## One sketch, one folder

- A sketch lives in `sketches/NN-short-name/`. `NN` is two digits, in the order sketches were started; `short-name` is lowercase words joined by hyphens, naming the site or idea (`02-haida-witness-composite`, not `test2` or `new-model`).
- Start one with `node scripts/new-sketch.mjs "Name" --author "You"`. It takes the next number. Never renumber or reuse a number, even when a sketch is retired: links and notes elsewhere point at those names.
- Versions of the same sketch stay in the same folder and are tracked by git history and the README's Status line (`v0.2`). A different idea, site or method gets a new number. If a sketch forks another, say so in its README (`Forked from 02 on 2026-10-20`).
- Everything a sketch needs to run is inside its folder: its own `package.json` and lock file, its own data, its own fonts list. Sketches may copy from one another but do not import across folders.
- Retired sketches stay where they are with `Status: retired` in the README header.

## README header

The first lines of every sketch README feed the index in the root README:

```
# 03 · Cloud seeding over the Sierra

Author: Name · Started: 2026-10-20 · Status: sketch · Stack: Vite + three.js

One paragraph: what it shows and the question it asks. The first sentence becomes the summary in the index.
```

Then: how to run it, what is on screen, the files, and **Sources and limits** (producer, date, licence, and whether each layer is observed, reanalysed, modelled, synthetic or interpretive). After editing headers, run `node scripts/index-sketches.mjs`; CI fails if the index is out of date.

## What goes in git

| In git | On the shared drive (Box: 2026 Realtime Weather) |
| --- | --- |
| code, configs, lock files | raw downloads and source archives you can re-fetch |
| small data the sketch reads at run time (JSON, GeoJSON, CSV, small rasters) | research dossiers: readings, news, PDFs |
| derived images and meshes the sketch displays, each under 10 MB | full-resolution renders, prints, video, audio |
| scripts that fetch and derive the data | Photoshop / Affinity / Blender / Rhino working files |
| a manifest of sources (URL, date, licence, transform) | licensed fonts (ABC Diatype and others) |

Rules of thumb: no single file over 10 MB (`scripts/check-sizes.mjs` fails the push), and keep a sketch under about 50 MB in git. If a sketch needs something bigger, put it in `02 Sketch Assets/NN-name/` on Box and add it to the sketch's `assets.json` with `required: true`; `node scripts/assets.mjs pull NN` copies it into `sketches/NN-name/assets/`, which git ignores.

The root `.gitignore` blocks common heavy or licensed types (psd, afdesign, blend, mov, mp4, zip, otf, woff, woff2 …). If a small file of that type truly belongs in a sketch, for example an open-licence web font, add it with `git add -f` and say why in the commit message.

## assets.json

```json
{
  "sketch": "03-cloud-seeding-over-the-sierra",
  "items": [
    { "id": "radar", "src": "02 Sketch Assets/03-cloud-seeding-over-the-sierra/radar", "dest": "assets/radar",
      "required": true, "about": "NEXRAD level II, 2026-01-12 to 01-15, 4.1 GB; scripts/fetch_radar.py" }
  ]
}
```

`src` is relative to the Box folder **2026 Realtime Weather**; `dest` is relative to the sketch (use `null` for reference material the sketch does not read).

## Commits

- Work on `main` for your own sketch; small, frequent commits whose message starts with the sketch number: `02: refine cells where the water is active`.
- Changes outside your sketch (root files, scripts, someone else's sketch) go through a short branch and a pull request.
- Run the sketch's own checks before pushing (for 01: `pnpm check`, `pnpm lint`, `pnpm build` inside its folder).
