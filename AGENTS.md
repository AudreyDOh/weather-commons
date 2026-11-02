# Instructions for coding agents

This repository is a collection of independent, numbered sketches for the Weather Commons working group. Read `README.md` and `CONTRIBUTING.md`, then the README (and AGENTS.md, if present) of the sketch you are working in. A sketch's own AGENTS.md takes precedence inside its folder; `sketches/01-realtime-weather-pilot/AGENTS.md` is the project lead's guide for that pilot.

## Scope

- If the sketch has a `NOTES.md`, read it before anything else: it holds what the people want next, decisions already made and open questions. Work from it, and when you finish, move what you did to its Done section with the date; add questions you could not settle under Questions.
- Work inside one `sketches/NN-name/` folder per task. Edit root files, `scripts/`, `.github/` or another sketch only when the person asks.
- A new idea, site or method gets a new sketch: `node scripts/new-sketch.mjs "Name" --author "Name" --stack "…"`. Never create a sketch folder by hand, never renumber, never reuse a number.
- A sketch is self-contained: no imports or file references across sketch folders, its own package.json and lock file if it has dependencies.

## Code, assets, Box

- Git holds code and small data. No tracked file over 10 MB; keep a sketch under about 50 MB. Run `node scripts/check-sizes.mjs` before committing.
- Large, raw, licensed or finished files go to the Box folder "2026 Realtime Weather". Move them with `node scripts/assets.mjs add NN <path> --about "<source, date, licence, how it was made>"` (add `--required` if the sketch cannot run without it), then commit the updated `assets.json`. Do not commit the file itself.
- Get a sketch's Box files with `node scripts/assets.mjs pull NN --all`. They land in `sketches/NN-name/assets/`, which git ignores; never `git add -f` anything there.
- Code reads large files only from the sketch's `assets/` folder (or files tracked in the sketch). Never hard-code a Box path, a user's home directory or an absolute path in sketch code.
- Do not rename, move or delete anything on Box that an `assets.json` points to. Do not write into `00 Presentations`, `01 Geoengineering Events, Technologies, Sites` or `03 Renders` unless asked.
- Never commit secrets, `.env` files, licensed fonts (otf, woff, woff2) or working files (psd, afdesign, blend, mov, mp4, zip).

## Documentation and claims

- Every sketch README starts with the header in CONTRIBUTING.md §6 and has a **Sources and limits** section. After editing a header run `node scripts/index-sketches.mjs`.
- Record producer, dataset version, valid time, retrieval date, licence and transform for every dataset, in the README or in `assets.json` `about`.
- Keep observed, reanalysed, modelled, synthetic, cartographic and interpretive material distinct in interface copy, exports and READMEs. Never present a synthetic field or a simulation as observed data.

## Commits

- Commit messages start with the sketch number: `02: …`. Root changes start with `repo: …`.
- Run the sketch's own checks before committing (sketch 01: `pnpm check`, `pnpm lint`, `pnpm build`).
- Do not deploy, change repository visibility or force-push unless the person asks.
- The repository is public, and a push to `main` redeploys GitHub Pages with every sketch listed in `PUBLISHED` in `scripts/build-pages.mjs`. Add a sketch to that list only when the person asks. In a published sketch, load files with relative paths so the page works under `/weather-commons/NN-name/`.
