# Roadmap

## Current: local feasibility pilot

- [x] Fast browser simulation and 3D height shell.
- [x] A sourced historical case with provenance manifest.
- [x] Import/export for bounded contribution files.
- [x] A responsive, minimal evidence-first interface.

## Next: workshop-ready contribution system

- [ ] Add a guided contribution editor with field previews and provenance validation.
- [ ] Define a reviewed contribution schema for narrative waypoints, institutions, media, and spatial layers.
- [ ] Add a local gallery and a facilitator review state.
- [ ] Make the glossary and evidence distinctions available at the point of use.

## Next: dynamic Earth imagery

- [x] Soften cloud isolation and add explicitly labelled visual dissolves; preserve individual-frame inspection on pause.
- [ ] Prioritize geostationary 10-minute imagery for actual cloud evolution. GOES covers the Americas; use Himawari for the Asia-Pacific study rather than forcing global MODIS daily imagery into a motion sequence.

- [x] Add a time controller that keeps observation time separate from simulation time.
- [x] Implement a low-resolution daily imagery adapter using NASA GIBS: six archived 2048 × 1024 WMS frames, local playback, scrubbing, opacity and provenance.
- [ ] Add resolution-dependent imagery tiles for closer inspection; this first archive has a fixed global overview resolution.
- [ ] Add a regional 5–10-minute cloud loop adapter for GOES, Himawari, or Meteosat, with an explicit source label and frame timestamp.
- [x] Bound the pilot cache to six overview frames, fetched on demand with next-frame preloading; no live NASA calls are made in participant browsers.
- [ ] Replace the fixed cache with an evicting tile/frame cache when the catalogue grows.

## Next: true depth

- [x] Add approximate visual cloud isolation on a separate shell with explicit assumed height, true-scale and exaggerated-scale controls.
- [ ] Replace brightness isolation with a quality-screened scientific cloud mask (MOD35/MYD35) and pair it with compatible cloud-top retrievals (MOD06/MYD06). Preserve missing swaths and record acquisition-time alignment.
- [ ] Move particles, vector layers and shells into a shared depth-tested renderer before claiming physically correct occlusion between all layers.

- [ ] Replace the smooth ground sphere with a terrain/bathymetry mesh driven by GEBCO and a terrain source.
- [ ] Render independent ground, bathymetry, ocean-current, cloud, atmospheric, vector, and institutional layers.
- [ ] Keep camera, imagery, and particle rendering in compatible geographic projections.

## Later: shared online programme

- [ ] Choose authentication and a private object store for contribution files.
- [ ] Use server jobs for NetCDF/GRIB conversion, spatial tiling, and any established-model comparisons.
- [ ] Publish only reviewed, versioned derived subsets to the client.
- [ ] Establish an editorial protocol for historical claims, participant permissions, and archival media rights.
