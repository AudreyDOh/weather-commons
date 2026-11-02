# Working on the pilot

This is the project lead's guide for sketch 01. It adds to the repository's AGENTS.md and wins inside this folder.

## What the pilot is

A browser-based research pilot for the Realtime Weather working group. It mixes sourced historical material, observed or reanalysed data, deliberately synthetic teaching fields, and a light tracer simulation. Keep these kinds of material clearly apart in the interface, in exports and in the docs.

## Working

- Install with `pnpm install` and start with `pnpm dev`.
- Before committing code, run `pnpm check`, `pnpm lint` and `pnpm build`.
- Don't deploy, push or change repository visibility unless the project lead asks.
- The project lead has asked for small commits and pushes at each milestone. After the checks, update the roadmap and the milestone log, then push normally to `origin/main`. That doesn't cover force-pushing or deploying anywhere other than the GitHub Pages site below.
- The repository is public, and a push to `main` republishes the static version on GitHub Pages. Everything committed here is public, so commit nothing private.
- Code that loads a file from `public/` passes its path through `publicUrl()` (`lib/weather/public-url.ts`), so the page works in its sub-folder online. Check with `node scripts/build-pages.mjs` from the repository root.

## Data and claims

- Keep original downloads in `public/data/archive/`. Record the source address, download time, every change and the SHA-256 checksum in `manifest.json`.
- Every visual layer says whether it is observed, reanalysed, modelled, synthetic, cartographic or interpretive.
- Never infer exposure, injury, rainfall change or political cause from nearness to tracers alone.
- Participants' imports are data only. Check them against the schema, and never run imported content.
- **Cloud tops:** ACHA heights are retrieved values, not volumetric clouds. Keep:
  - quality flags and scan times;
  - the source's own positioning;
  - the difference between source height and on-screen exaggeration;
  - image time separate from model time.
- **Regional tiles:** they use a spherical reference, not a full ellipsoid. Keep source elevation, on-screen exaggeration, mesh spacing and image pixel size apart. Don't connect outside tilesets without stating their coordinate and height references. See `docs/STREAMING.md`.

## Interface

- The globe and the evidence come first. Controls stay secondary and appear when needed.
- **Type:**
  - Use the bundled Libre Franklin at weight 400 everywhere, and don't let installed medium weights override it. The lead asked for lighter type after the Franklin Gothic Medium pass.
  - All interface text is uppercase.
  - Use only the 12 px (metadata), 14 px (body) and 28 px (titles) sizes, and no italics.
- **Colour:**
  - The default is warm white with black text. A dark background stays available.
  - Controls stay in the same globe workspace.
  - Interface chrome is black and white.
  - Scientific imagery stays vivid: keep the source colours of GOES RGB and infrared products, including their own map lines. Don't invent vectors, lighting or physical meaning for those colours.
- Prefer a few lasting controls and clear source labels over many features.

## Contributions

Every contribution needs:
- a title and an author;
- a documented source;
- parameters;
- a wind (velocity) field;
- a short story.

A workshop-ready one also has a note on where everything came from, a clear split between observed and calculated material, and the places or institutions involved. See `CONTRIBUTING.md` and `docs/WORKSHOP.md`.
