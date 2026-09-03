# Pilot status

## Working now

- Two switchable studies: a synthetic Atlantic teaching field and an archival Project Popeye study built from a documented 1966 ERA5 reanalysis sample.
- A browser-worker passive-tracer solver with seeded horizontal and vertical diffusion, decay, regular-grid interpolation, domain loss, deterministic exports, and 3D height projection.
- A local NASA Blue Marble surface, Natural Earth coastlines and administrative boundaries, selected infrastructure markers, rivers, and geographic anchors.
- An evidence-led casebook that separates archival claims, observed/reanalyzed input, calculated tracer output, and non-inferences.
- Portable JSON import/export and schema validation for workshop contributions.

## Deliberate limits

The pilot is not an operational forecast, a cloud microphysics model, an exposure model, or a reconstruction of Project Popeye. The historical wind field is one 00:00 UTC 100 m reanalysis frame held constant. The Earth is an orthographic sphere; imagery is a static 2004 NASA composite, terrain and bathymetry are not yet meshes, and no live feed or shared storage is connected.

## Verification

`pnpm check` tests transport invariants, deterministic output, regular-grid interpolation, vertical behavior, 3D occlusion, the archival data transform, and contribution validation. `pnpm lint` and `pnpm build` verify the application toolchain.

## Repository privacy

`package.json` marks the package private. The configured remote is GitHub at `RealtimeUrbanismLab/weather-commons`; confirm its visibility in the GitHub repository Settings or with `gh repo view RealtimeUrbanismLab/weather-commons --json visibility,isPrivate` on a machine with GitHub CLI. No credentials, participant data, or private workshop material should enter this repository.
