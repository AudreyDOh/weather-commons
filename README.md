# Weather Commons

Sketches, models and pilots for the Weather Commons working group (Realtime Urbanism Lab, Cornell AAP): weather modification, atmospheric data and the governance of the sky, explored as small browser-based instruments.

Each sketch is self-contained in `sketches/NN-name/`, with its own README, dependencies and data. Sketches can share ideas, never files: copy what you need into your sketch so each one keeps running on its own.

## Sketches

<!-- sketches:start -->
| No. | Sketch | Author | Status | Stack | What it is |
| --- | --- | --- | --- | --- | --- |
| 01 | [Realtime Weather](sketches/01-realtime-weather-pilot/) | Farzin Lotfi-Jam | pilot | vinext (Next on Vite) + React + three.js, Cloudflare | An evidence-led technical pilot for the Weather Commons working group. |
| 02 | [Haida witness composite](sketches/02-haida-witness-composite/) | Boone Mercado (with Claude) | sketch, v0.2 | static HTML + JS, no build step | A layered model of the 2012 Haida Gwaii iron dump. |
<!-- sketches:end -->

The table is generated from each sketch's README header by `node scripts/index-sketches.mjs`.

## Layout

```
sketches/
  01-realtime-weather-pilot/    each sketch: README.md, assets.json, its own package.json if it has one
  02-haida-witness-composite/
  …
scripts/
  new-sketch.mjs                start the next numbered sketch
  index-sketches.mjs            rebuild the table above
  assets.mjs                    list / check / pull large files from the shared drive
  check-sizes.mjs               no tracked file over 10 MB (also runs on GitHub)
.github/workflows/              the two checks above on every push and pull request
```

## Start a sketch

```bash
node scripts/new-sketch.mjs "Cloud seeding over the Sierra" --author "Your Name" --stack "Vite + three.js"
```

That creates the next number (`03-cloud-seeding-over-the-sierra/`), a README to fill in and an empty `assets.json`, and adds the row above. Numbers only go up and are never reused. See [CONTRIBUTING.md](CONTRIBUTING.md) for naming, what goes in git and what goes on the shared drive.

## Large files and the shared drive

Git holds code, small data and small derived images that a sketch needs to run. Raw downloads, research dossiers, renders, video, working files (Photoshop, Affinity, Blender, Rhino) and licensed fonts live in the Box folder **2026 Realtime Weather**:

```
2026 Realtime Weather/
  00 Presentations/
  01 Geoengineering Events, Technologies, Sites/   research dossiers (01 Geoengineering, 02 Rituals)
  02 Sketch Assets/
    _shared/fonts/                                 licensed fonts, never in git
    02-haida-witness-composite/                    one folder per sketch, same name as in git
```

Each sketch's `assets.json` lists what it uses from there. With Box Drive installed:

```bash
node scripts/assets.mjs list
node scripts/assets.mjs check 02
node scripts/assets.mjs pull 02 --all      # copies into sketches/02-…/assets/ (ignored by git)
```

If Box is synced somewhere other than `~/Box/2026 Realtime Weather`, set `WC_ASSETS` to that folder.

## Hosting note

`01-realtime-weather-pilot` moved from the repository root into its folder on 2026-10-08, unchanged. Any hosting or build service connected to this repository must now use `sketches/01-realtime-weather-pilot` as its root directory.
