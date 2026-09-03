# Pilot status

## Working now

- Franklin-style sans-serif typography: local Franklin Gothic Medium with bundled OFL Libre Franklin fallback, uppercase text, and 12/14/28 px scales.
- Cloud isolation retains grey transparency through a wider feathered threshold and a small five-tap spatial filter. Softness is adjustable. Daily cloud playback uses a labelled 1.4-second visual dissolve, with 2.4-second frame intervals, and stops at the end. Pausing/scrubbing returns to an individual source frame. The dissolve is not measured motion or a temporal reconstruction.

- Two switchable studies: a synthetic Atlantic teaching field and an archival Project Popeye study built from a documented 1966 ERA5 reanalysis sample.
- A browser-worker passive-tracer solver with seeded horizontal and vertical diffusion, decay, regular-grid interpolation, domain loss, deterministic exports, and 3D height projection.
- A local NASA Blue Marble surface, Natural Earth coastlines and administrative boundaries, selected infrastructure markers, rivers, and geographic anchors.
- An evidence-led casebook that separates archival claims, observed/reanalyzed input, calculated tracer output, and non-inferences.
- Portable JSON import/export and schema validation for workshop contributions.
- Six dated NASA Terra/MODIS daily mosaics (24–29 September 2024), independently playable and scrubbable with opacity blending over the globe. Original PNGs, request URLs and hashes are committed; imagery loads on demand with one-frame lookahead.

## Deliberate limits

Cloud isolation now removes darker and strongly coloured pixels using a GPU display heuristic. It is not NASA MOD35 classification: snow/ice/bright terrain can leak through and thin clouds can disappear. The extracted texture sits on a separate front-facing spherical shell, default assumed height 6 km at 50× exaggeration. Controls allow 0–12 km and 1×/50×/200×. The original mosaic remains a ground-level layer. Cloud geometry is not volumetric; tracers and vector annotations remain foreground overlays rather than a shared depth-tested scene. Missing swath coverage stays missing in both modes.

The pilot is not an operational forecast, a cloud microphysics model, an exposure model, or a reconstruction of Project Popeye. The historical wind field is one 00:00 UTC 100 m reanalysis frame held constant. The Earth is an orthographic sphere with a static 2004 background and an optional 2024 daily satellite archive. Terrain and bathymetry are not yet meshes, and no live feed or shared storage is connected. Satellite images combine surface and clouds without measured cloud heights. The observation date never alters the solver's time or wind.

## Verification

`pnpm check` tests transport invariants, deterministic output, regular-grid interpolation, vertical behavior, 3D occlusion, the archival data transform, and contribution validation. `pnpm lint` and `pnpm build` verify the application toolchain.

## Repository privacy

Authenticated GitHub API and GitHub CLI checks confirmed `RealtimeUrbanismLab/weather-commons` is private on 3 September 2026 UTC. `main` tracks `origin/main`. The project lead requested incremental milestone commits and pushes after verification. Recheck visibility before pushing if the remote changes. `package.json` being private only prevents npm publication; it does not control GitHub visibility.
