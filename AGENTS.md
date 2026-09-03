# Weather Commons contributor guide

## Purpose

This repository is a browser-based research pilot for the Realtime Weather working group. It combines sourced historical material, observed or reanalyzed data, deliberately synthetic teaching fields, and a lightweight passive-tracer simulation. Keep those categories visibly distinct in interface copy, exports, and documentation.

## Working locally

- Install with `pnpm install` and start with `pnpm dev`.
- Run `pnpm check`, `pnpm lint`, and `pnpm build` before committing code changes.
- Do not deploy, push, or change repository visibility unless the project lead explicitly requests it.
- The project lead has requested incremental milestone commits and pushes for this pilot. After the checks above, update the roadmap and milestone log and push normally to the verified private `origin/main`. This does not authorize public website deployment or force-pushing.

## Data and claims

- Keep original downloaded responses in `public/data/archive/`; record source URL, retrieval time, transform, and SHA-256 in `manifest.json`.
- A visual layer must declare whether it is observed, reanalyzed, modelled, synthetic, cartographic, or interpretive.
- Never infer exposure, injury, rainfall change, or political causality from tracer proximity alone.
- Student imports are data only. Validate their schema and do not execute imported content.

## Interface direction

- The globe and evidence are the primary experience; controls remain secondary and are disclosed as needed.
- Use the local STIX Two Text face. Interface chrome and headings are uppercase; longer historical and methodological prose remains sentence case for legibility.
- Maintain a restrained monochrome palette. Do not add decorative gauges, dashboards, or invented realism.
- Prefer a few durable controls and clear source labels over feature density.

## Contribution shape

Every contribution needs a title, author, a documented source, parameters, a velocity field, and a narrative. A workshop-ready submission also includes a provenance note, the distinction between observed and calculated material, and any relevant geographic or institutional context. See `CONTRIBUTING.md` and `docs/WORKSHOP.md`.
