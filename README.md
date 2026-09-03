# Realtime Weather

An evidence-led technical pilot for the Weather Commons working group. It lets participants place a small, documented atmospheric field inside a spatial narrative and inspect the difference between source material, model rules, calculated tracer movement, and interpretation.

## Run locally

Requires Node 22.13+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm check
pnpm lint
pnpm build
```

The local pilot opens at the URL printed by `pnpm dev`. It has no accounts, server storage, live weather feed, or collaboration service: imported contributions remain in the current browser until exported.

## What is included

- A fast, browser-worker passive-tracer simulation with documented assumptions, reproducible seeded runs, 3D height, diffusion, decay, and grid boundaries.
- Two studies: a synthetic Atlantic teaching field and an archival Project Popeye study based on a deliberately limited 1966 ERA5 reanalysis snapshot.
- A local NASA Blue Marble surface, Natural Earth cartography, selected institutional infrastructure, and case-specific geographic context.
- An evidence casebook that marks observed/reanalyzed input, synthetic assumptions, calculation, archival claims, and non-inference.
- Validated portable JSON contributions for workshop research and narration.

It is not a forecast, an atmospheric-dynamics solver, an exposure assessment, a weather-modification reconstruction, or a decision tool. Refer to [SOURCES.md](SOURCES.md) for evidentiary scope.

## Repository map

- [CONTRIBUTING.md](CONTRIBUTING.md) — contribution schema and provenance requirements.
- [docs/STATUS.md](docs/STATUS.md) — current capability and deliberate limits.
- [docs/WORKSHOP.md](docs/WORKSHOP.md) — four-session structure and participant outputs.
- [docs/DATASETS.md](docs/DATASETS.md) — practical sources for imagery, models, ocean, and sensing infrastructure.
- [docs/ROADMAP.md](docs/ROADMAP.md) — next implementation phases.
- [AGENTS.md](AGENTS.md) — development norms for contributors and coding agents.

## Data and provenance

The project commits small source responses and processed artifacts needed to reproduce the archival case. `public/data/archive/manifest.json` records hashes, source URLs, and transformations. Raw data, derived fields, and visual layers must always state their origin, valid time, spatial scope, and limits.

The primary case does not attribute rainfall, civilian harm, or any event outcome to Project Popeye. Its released tracers are a hypothetical visual experiment through a stationary reanalysis field, not a reconstruction of an operation.

## Privacy and publishing

This is a private package and should remain a private repository while it contains workshop development material. Before connecting participants, establish authentication, a private object store, an editorial review step, and a clear policy for contributors' data and media rights. The planned online architecture is documented in [docs/ROADMAP.md](docs/ROADMAP.md).
