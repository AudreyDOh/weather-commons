# Progressive Earth layers

## What runs now

The application keeps one Three.js camera, globe and geographic layer stack. Zoom changes camera behavior and requested detail, not the application or map projection. Globe drag rotates around Earth; regional drag pans the geographic anchor; close drag orbits that anchor. Tilt eases in continuously. Shift-drag swaps the local gestures, a button exposes pan at close range, and pinch changes zoom. Double-click approaches a picked surface location.

The Mount Rainier pilot demonstrates actual OGC 3D Tiles loading. It has 85 local GLBs in four quadtree levels, combining USGS 3DEP elevation with USGS NAIP aerial imagery. Tile selection uses projected geometric error. Available ancestors remain while finer tiles load. The status label reports the finest visible level, not a claim that the entire viewport has that resolution.

`terrain-catalog.ts` defines coverage and source paths. `terrain-tiles.ts` lazily initializes NASA AMMOS's `3d-tiles-renderer` and owns its cache and queues. `earth-scene.ts` integrates its meshes and inspection with the existing scene. `navigation.ts` contains the camera transition and pan math. `prepare-terrain-tiles.py` reproduces the archive and pyramid; `check-terrain.mjs` checks hashes, hierarchy, transformed heights and navigation.

The cache is configured for 24–48 tiles and 48–80 MiB of estimated content, with four downloads per origin and one parse job. These are eviction targets, not a hard bound on all GPU/browser memory. Requests already underway may complete after leaving the region. An error message identifies failed detail loads; if no regional tile can be displayed, the global overview is restored; re-entering the view retries failed tiles. The separate height-lookup file is loaded once; if that fails, source inspection and terrain clearance are limited until reload.

## Why the layers need different formats

| Layer                      | Useful delivery format                                                          | Current pilot                                              |
| -------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Basemap / aerial imagery   | Versioned XYZ/WMTS raster tiles                                                 | Global overview plus tiled NAIP textures at Rainier        |
| Terrain / bathymetry       | Tiled elevation mesh or elevation raster with mesh generation                   | ETOPO1 overview plus regional GLB terrain pyramid          |
| Buildings / photogrammetry | OGC 3D Tiles with glTF content                                                  | A bounded, untiled Manhattan extrusion sample              |
| Satellite observations     | Time-indexed raster tiles or scientific grids, with navigation/quality metadata | Archived GOES presentation images and ACHA retrieval grids |
| Scientific fields          | Spatial/time chunks with units and coordinate metadata                          | Bounded contribution fields and worker simulation          |
| Narratives / institutions  | Validated records and geographic waypoints                                      | Existing evidence and contribution JSON                    |

The formats can share the same scene without implying that their dates, uncertainty or physical references agree. Tile refinement is display interpolation and selection; it does not create measurements. Rainier remains at 1× source height regardless of global relief exaggeration. Its aerial and DEM mosaics have differing dates. The global/regional boundary is still visible. Terrain does not drive the tracer equations.

## Do we need a mapping service?

Progressive delivery is necessary for broad high-resolution coverage. A commercial mapping account is optional: reviewed, licensed tiles can be served from our own object store/CDN. This pilot serves a small static archive locally and requires no participant API key. The full derived Rainier archive is approximately 21.4 MB; clients request selected detail rather than downloading all 85 GLBs initially.

For worldwide coverage, choose providers and budgets for imagery, elevation and buildings separately. Evaluate attribution, redistribution rights, update cadence, resolution, coverage and data references before choosing a service. No provider account, paid subscription, public bucket or deployment has been created.

Use immutable versioned paths, compression/cache headers, an attribution ledger, and a small regional catalogue. Preserve original responses and derivations privately. Generate heavy NetCDF/GRIB/terrain derivatives in server jobs, then publish reviewed subsets to authorized clients. Participant uploads need validation, authentication, private storage and facilitator review before they become shared layers.

## Next engineering steps

1. Introduce an ellipsoid-aware reference adapter before importing arbitrary external ECEF tilesets. The pilot currently maps spherical ECEF-like metres onto a 6,371 km sphere; source vertical datums are not converted to ellipsoidal heights.
2. Add adjacent regional coverage and a better boundary transition, then independent imagery tiles. Avoid silently repeating or synthesizing unavailable detail.
3. Tile the city sample and replace its flat datum when compatible terrain becomes available. Surveyed facades need a documented source.
4. Validate camera clearance and touch gestures on physical devices, then test bandwidth and memory on workshop hardware. The current camera clearance check is regional DEM-based, not collision detection for every object.
5. Extend contribution schemas with source kind, bounds, coordinate/height reference, resolution, dates, license and narrative waypoints. Imports remain data only; current participant JSON cannot execute plugins or load arbitrary tilesets.

References: [OGC 3D Tiles](https://www.ogc.org/standards/3dtiles/), [NASA AMMOS renderer usage](https://github.com/NASA-AMMOS/3DTilesRendererJS/blob/master/USAGE.md), and the archived USGS service/catalogue responses linked from the in-app source ledger.
