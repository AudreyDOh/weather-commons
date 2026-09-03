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

- [ ] Add a time controller that keeps observation time separate from simulation time.
- [ ] Implement a low-resolution daily imagery adapter using NASA GIBS or equivalent licensed imagery.
- [ ] Add a regional 5–10-minute cloud loop adapter for GOES, Himawari, or Meteosat, with an explicit source label and frame timestamp.
- [ ] Cache a small rolling frame window; never request full-resolution global imagery directly in every participant browser.

## Next: true depth

- [ ] Replace the smooth ground sphere with a terrain/bathymetry mesh driven by GEBCO and a terrain source.
- [ ] Render independent ground, bathymetry, ocean-current, cloud, atmospheric, vector, and institutional layers.
- [ ] Keep camera, imagery, and particle rendering in compatible geographic projections.

## Later: shared online programme

- [ ] Choose authentication and a private object store for contribution files.
- [ ] Use server jobs for NetCDF/GRIB conversion, spatial tiling, and any established-model comparisons.
- [ ] Publish only reviewed, versioned derived subsets to the client.
- [ ] Establish an editorial protocol for historical claims, participant permissions, and archival media rights.
