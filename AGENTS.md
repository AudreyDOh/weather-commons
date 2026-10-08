# Notes for contributors and coding agents

This repository is a collection of independent sketches for the Weather Commons working group. Read the root README and CONTRIBUTING.md first, then the README (and AGENTS.md, if present) of the sketch you are working in. A sketch's own AGENTS.md takes precedence inside its folder; `sketches/01-realtime-weather-pilot/AGENTS.md` is the project lead's guide for that pilot.

- Work inside one `sketches/NN-name/` folder per task. Do not edit another sketch, root files or `scripts/` unless asked.
- New work gets a new folder via `node scripts/new-sketch.mjs`; never renumber.
- Do not commit files over 10 MB, raw downloads, renders, video, working files or licensed fonts. Put them on the shared Box folder and list them in the sketch's `assets.json` (see CONTRIBUTING.md). Run `node scripts/check-sizes.mjs` before committing.
- Keep observed, reanalysed, modelled, synthetic, cartographic and interpretive material distinct in interface copy, exports and READMEs, and record source, date, licence and transform for every dataset.
- Do not deploy, change repository visibility or force-push unless the project lead asks.
