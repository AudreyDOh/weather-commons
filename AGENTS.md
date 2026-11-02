# Instructions for coding agents

This repository holds numbered sketches made by the Realtime Weather working group. Each sketch is one idea in its own folder, `sketches/NN-name/`. Read `README.md` and `CONTRIBUTING.md`, then the README of the sketch you are working in. If the sketch has its own AGENTS.md, it wins inside that folder. `sketches/01-realtime-weather-pilot/AGENTS.md` is the project lead's guide for the pilot.

The workshop is about how weather is monitored, modelled, managed and shown in real time: what these practices do on their own terms, and where they sit socially, politically and globally. Sketches model an event and its effects, and they can be scientific, geographic, historical or critical. The workshop has four parts: Event, Simulate, Situate, Narrate (see `docs/workshop/README.md`).

## Working with workshop participants

Many participants are new to code, GitHub and Claude. When you work for one:

- Explain what you are about to do and why, in one or two plain sentences, before you do it. Avoid jargon, or explain it in a few words.
- Work only in their own sketch folder. Never edit another person's sketch, the root files, `scripts/` or `.github/` for them.
- A new sketch uses the number the facilitators gave them: `node scripts/new-sketch.mjs "Title" --number NN --author "Their Name"`. If they don't know their number, ask them to check with a facilitator rather than guessing. The `start-sketch` skill walks through this.
- Keep pages simple: black and white, a system font, no frameworks unless they ask. Load files with relative paths (`data/x.json`, not `/data/x.json`) so the page works on the published site.
- Label every layer as observed, reanalysed, modelled, synthetic or interpretive, and fill in **Sources and limits** as you go. Never present made-up or simulated data as observed.
- When they want to publish, use the `publish` skill. It runs the checks, commits, pushes, opens or merges the pull request in their fork, and gives them the live address. To add their sketch to the shared site, open a pull request from their fork to `RealtimeUrbanismLab/weather-commons`.
- When something fails, say what happened in plain words and what to try next. Point them to the community space for help from others: https://community.ocean-archive.org/spaces/25478985

## Scope

- If the sketch has a `NOTES.md`, read it first. It holds what people want next, decisions made and open questions. When you finish, move what you did to Done with the date, and add anything you couldn't settle under Questions.
- Work inside one sketch folder per task. Edit root files, `scripts/`, `.github/` or another sketch only when the person asks.
- A new idea, site or method gets a new sketch, made with `scripts/new-sketch.mjs`. Never make a sketch folder by hand, never renumber, never reuse a number.
- A sketch stands alone: no imports or file links across sketch folders, and its own `package.json` and lock file if it needs packages.

## Files and Box

- Git holds code and small data. No file over 10 MB, and keep a sketch under about 50 MB. Run `node scripts/check-sizes.mjs` before committing.
- Large, raw, licensed or finished files go to the lab's Box folder "2026 Realtime Weather" (lab members only). Move them with `node scripts/assets.mjs add NN <path> --about "<source, date, licence, how it was made>"` (`--required` if the sketch can't run without it), then commit `assets.json`, not the file.
- `node scripts/assets.mjs pull NN --all` copies a sketch's Box files into `sketches/NN-name/assets/`, which git ignores. Never `git add -f` anything there.
- Sketch code reads large files only from its `assets/` folder or its own tracked files. Never hard-code a Box path, a home folder or any absolute path.
- On Box, don't rename, move or delete anything an `assets.json` points to, and don't write into `00 Presentations`, `01 Geoengineering Events, Technologies, Sites` or `03 Renders` unless asked.
- Never commit secrets, `.env` files, licensed fonts (otf, woff, woff2) or working files (psd, afdesign, blend, mov, mp4, zip).

## Sources and claims

- Every sketch README starts with the header described in CONTRIBUTING.md and has a **Sources and limits** section. After editing a header, run `node scripts/index-sketches.mjs`.
- For every dataset, record who made it, the version, the time it describes, when it was downloaded, its licence and what was changed, in the README or in `assets.json` (`about`).
- Keep observed, reanalysed, modelled, synthetic, cartographic and interpretive material clearly apart in the page, in exports and in the README.

## Commits and publishing

- Commit messages start with the sketch number (`12: add rainfall layer`). Root changes start with `repo:`.
- Before committing, run `node scripts/check-sketches.mjs` and the sketch's own checks (sketch 01: `pnpm check`, `pnpm lint`, `pnpm build`).
- The repository is public. A push to `main` rebuilds the site with every sketch that has an `index.html` (see `scripts/build-pages.mjs`). A sketch stays off the site with `Publish: no` in its README header.
- Don't deploy anywhere else, change repository visibility or force-push unless the person asks.
