# Weather Commons contributor guide

## Purpose

This repository is a browser-based research pilot for the Realtime Weather working group. It combines sourced historical material, observed or reanalyzed data, deliberately synthetic teaching fields, and a lightweight passive-tracer simulation. Keep those categories visibly distinct in interface copy, exports, and documentation.

## Working locally

- Install with `pnpm install` and start with `pnpm dev`.
- Run `pnpm check`, `pnpm lint`, and `pnpm build` before committing code changes.
- Do not deploy, push, or change repository visibility unless the project lead explicitly requests it.
- The project lead has requested incremental milestone commits and pushes for this pilot. After the checks above, update the roadmap and milestone log and push normally to `origin/main`. This does not authorize force-pushing or any deployment beyond the one below.
- The repository is public (2026-11-02), and a push to `main` redeploys the static export on GitHub Pages (`.github/workflows/pages.yml`). Everything committed here is published, so commit nothing that must stay private. Code that loads a file from `public/` passes its root-relative path through `publicUrl()` (`lib/weather/public-url.ts`), so the static site works under its sub-path. Check with `node scripts/build-pages.mjs` from the repository root.

## Data and claims

- Keep original downloaded responses in `public/data/archive/`; record source URL, retrieval time, transform, and SHA-256 in `manifest.json`.
- A visual layer must declare whether it is observed, reanalyzed, modelled, synthetic, cartographic, or interpretive.
- Never infer exposure, injury, rainfall change, or political causality from tracer proximity alone.
- Student imports are data only. Validate their schema and do not execute imported content.
- ACHA cloud-top heights are retrieved quantities, not volumetric clouds. Preserve quality flags, scan intervals, source navigation and the distinction between source height and display exaggeration. Keep imagery time separate from model time.
- Regional tiles use a spherical reference adapter, not general ellipsoidal ECEF. Keep source elevation, display exaggeration, mesh spacing and imagery pixel size distinct. Do not connect external tilesets without declaring their coordinate and height references. See `docs/STREAMING.md`.

## Interface direction

- The globe and evidence are the primary experience; controls remain secondary and are disclosed as needed.
- The project lead requested lighter type after the Franklin Gothic Medium pass. Use bundled Libre Franklin at weight 400 consistently; do not let installed medium-weight faces override it. All interface text is uppercase. Use only the 12 px metadata, 14 px body, and 28 px title tokens; no italic styling.
- The default interface is warm white with black text; a dark background remains selectable. Keep controls within the same globe workspace.
- Keep interface chrome monochrome. The project lead requested vivid scientific imagery: preserve source colours in GOES RGB and infrared products, including their supplied cartography. Do not invent vectors, lighting, or physical meaning for those colours.
- Prefer a few durable controls and clear source labels over feature density.

## Contribution shape

Every contribution needs a title, author, a documented source, parameters, a velocity field, and a narrative. A workshop-ready submission also includes a provenance note, the distinction between observed and calculated material, and any relevant geographic or institutional context. See `CONTRIBUTING.md` and `docs/WORKSHOP.md`.
