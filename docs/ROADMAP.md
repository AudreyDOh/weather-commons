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
- [x] Add source-kind explanations, source links and original/derived archives at the point of use.
- [x] Add guided scene selection and click inspection of cloud, relief and building records.
- [ ] Extend the source glossary and inspection to every historical/sample layer.

## Next: dynamic Earth imagery

- [x] Soften cloud isolation and add explicitly labelled visual dissolves; preserve individual-frame inspection on pause.
- [x] Integrate four GOES sequences and a dated DMW image into the globe's geographic layer stack. Standalone comparison was superseded by one 3D workspace.
- [ ] Replace nominal published-JPEG registration with calibrated ABI channel products and source navigation metadata; validate coastline alignment and cloud parallax. Add Himawari for Asia-Pacific studies.

- [x] Add a time controller that keeps observation time separate from simulation time.
- [x] Implement a low-resolution daily imagery adapter using NASA GIBS: six archived 2048 × 1024 WMS frames, local playback, scrubbing, opacity and provenance.
- [ ] Add resolution-dependent imagery tiles for closer inspection; this first archive has a fixed global overview resolution.
- [ ] Add a regional 5–10-minute cloud loop adapter for GOES, Himawari, or Meteosat, with an explicit source label and frame timestamp.
- [x] Bound the pilot cache to six overview frames, fetched on demand with next-frame preloading; no live NASA calls are made in participant browsers.
- [x] Use an evicting four-entry GOES frame cache. A tile cache remains future work.

## Next: true depth

- [x] Add approximate visual cloud isolation on a separate shell with explicit assumed height, true-scale and exaggerated-scale controls.
- [ ] Replace brightness isolation with a quality-screened scientific cloud mask (MOD35/MYD35) and pair it with compatible cloud-top retrievals (MOD06/MYD06). Preserve missing swaths and record acquisition-time alignment.
- [x] Move particles, vector layers and shells into a shared Three.js depth-tested renderer. Transparent shells remain display surfaces, not physical optical volumes.

- [x] Replace the smooth ground sphere with a sourced ETOPO1 terrain/bathymetry mesh and independent sea-level surface.
- [x] Add a bounded OSM extrusion + NAIP aerial-texture city sample, with reported/assumed heights distinguished.
- [x] Keep camera, imagery and particles in the same geographic 3D scene.
- [x] Add building-level inspection of height provenance.
- [ ] Add resolution-dependent terrain meshes and shared local terrain datums.
- [x] Add ACHA cloud-top retrieval geometry with quality flags, source navigation, twelve matched scan windows and inspectable source heights.
- [ ] Add ocean-current fields only with documented data and equations.
- [ ] Add surveyed facades/photogrammetric 3D Tiles with licensing and provenance; remove the local flat city datum when suitable terrain is available.

## Later: shared online programme

- [ ] Choose authentication and a private object store for contribution files.
- [ ] Use server jobs for NetCDF/GRIB conversion, spatial tiling, and any established-model comparisons.
- [ ] Publish only reviewed, versioned derived subsets to the client.
- [ ] Establish an editorial protocol for historical claims, participant permissions, and archival media rights.
