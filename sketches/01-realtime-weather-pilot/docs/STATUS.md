# Pilot status

## Working now

- One perspective Three.js Earth scene. GOES imagery, terrain, seafloor, sea-level surface, assumed atmospheric/cloud shells, Natural Earth vectors, institutions and tracers use a shared depth buffer. Drag, wheel zoom, keyboard arrows and reset remain available.
- GOES GeoColor, Airmass RGB, Sandwich RGB and band 16: twelve source frames at ten-minute intervals, 3 September 2026 04:10–06:00 UTC. DMW is a separate 05:00 still. Product selection, playback, scrubbing, opacity and optional assumed layer separation are in **Earth**. The standalone image viewer has been removed.
- Source JPEGs are sampled using nominal geostationary forward navigation (source fixed-grid origin 75°W), rather than treated as equirectangular maps. This is presentation registration, not calibrated ABI geolocation. Source cartography and barbs remain baked into the image. Independent vector layers remain togglable.
- NOAA ETOPO1 ice-surface relief: an archived 2048 × 1024 signed metre grid, represented by a 768 × 384 terrain/seafloor mesh. True scale, 20× and 60× views; water opacity exposes submarine relief. The bathymetric colour ramp and lighting are interpretive aids.
- A bounded Lower Manhattan sample: 522 OSM footprint extrusions. Heights are tagged, inferred from levels at 3 m/level, or assigned an explicit 9 m fallback. USGS NAIP aerial imagery textures the local ground and roofs; walls are plain. The queried catalogue contains 2019 and 2023 imagery; this is not synchronized with GOES or the historical case.
- The local city patch uses a sea-level datum. Global relief is flattened to its reference sphere in the city view; the local aerial patch sits above it and surrounding Earth remains in the same scene. This is not surveyed urban terrain or a flood model.
- White background / black text by default, selectable dark background, bundled Libre Franklin 400, uppercase 12/14/28 px hierarchy. Panels stay closed until requested. Desktop and 390 px mobile controls have been reviewed.
- Existing deterministic transport worker, two studies, evidence casebook, portable validated JSON imports and exports. Terrain, buildings and satellite observations do not alter the transport equations.
- Earlier MODIS daily imagery retains the approximate feathered cloud appearance filter and labelled visual dissolves. Hide GOES to inspect it. These presentation images provide no cloud heights. A separate ACHA retrieval layer now supplies variable cloud-top geometry.

- Six guided views, a contextual bottom timeline, a source ledger and click inspection of relief, cloud samples and individual building records. Cloud inspection retains its original scan time even if playback advances.
- NOAA ABI-L2-ACHAF: twelve original NetCDF files matching the GOES scan windows. The selected 1086 × 1086 product is about 10 km at nadir, displayed at every second sample (543 × 543). Only DQF=0 and 0–20,000 m values survive. Missing samples and >2,500 m inter-vertex jumps are not bridged. Colours encode 0–20 km height; 1×, 20×, 50× and 100× scales are available. This is not the separate ACHA2KM product.

- Continuous globe → map → local orbit navigation, with smooth approach/tilt, pinch zoom, double-click approach, Shift-drag and a close-range pan toggle. Rainier camera height uses the archived DEM with a 20 m clearance check; this is not general scene collision detection.
- Regional USGS 3DEP + NAIP 3D Tiles: 85 GLBs across four quadtree levels, ~61 m finest elevation sampling and ~8 m aerial pixels over Mount Rainier. The renderer loads on approach, keeps coarse content while refining, and exposes loading/coverage/source information. The configured private LRU targets 48 tiles / 80 MiB estimated memory, four concurrent downloads and one parse job; these are cache settings, not a total GPU-memory guarantee. No runtime requests to upstream USGS services.

## Scientific and technical limits

GOES presentation images are not raw ABI channels. Nominal registration does not correct JPEG layout, limb uncertainty or cloud parallax. Do not derive geographic measurements from their pixel alignment. Source colors are unlit; visual opacity blends them with the underlying scene. The optional 6 km separation is assumed, multiplied by the displayed vertical scale, and never a cloud-top retrieval.

The global relief grid is an overview (~0.176° cells), not local surveying. Zoom does not add global overview resolution; the bounded Rainier archive has its own progressively loaded detail. Building roofs are flat and use a plan projection of aerial imagery, not a reconstructed facade/roof survey. OSM geometry may differ in date or alignment from NAIP. Extrusions use true height scale even when global relief or tracers are exaggerated.

Rainier uses source 3DEP heights placed radially on the project’s 6,371 km reference sphere. The source catalogue records vertical datums, including NAVD88; no conversion to ellipsoidal heights is performed. NAIP and DEM dates vary across their mosaics. The finite archive boundary uses downward tile skirts as display seam geometry, excluded from source measurement. A visible transition edge remains against the coarse global overview. Outside this archive, Earth remains coarse. Buildings still use the separate flat local datum.

ACHA is an algorithmic retrieval, not a direct observation of a complete cloud volume. Its geopotential heights are placed radially on a sphere. Navigation uses the source ellipsoid and scan grid; cloud parallax is not corrected. Triangles are display interpolation, not extra observations. No density, optical thickness, cloud base or microphysics is reconstructed.

The atmosphere is a transparent shell at an assumed 12 km ceiling, not volumetric weather. Transparent layers blend in a declared drawing order; depth testing against opaque geometry does not make them physically accurate optical volumes. Tracer heights still reference the solver's sphere, not terrain; some calculated points may be below the displayed exaggerated terrain. Never reinterpret this as deposition, exposure or injury.

No live feed, global high-resolution terrain service, volumetric microphysics, ocean-current model, photogrammetric building mesh, shared storage, accounts or online participant service is connected. The historical ERA5 field remains a single 1966 frame held constant. No weather-modification outcome is inferred.

## Validation and reproducibility

`pnpm check` covers transport invariants and archive transforms, source-image hashes/cadence, signed elevations, metre scaling, GOES orientation and hemisphere exclusion, building provenance, ACHA scan matching and source/derived hashes, valid navigation, and cloud-mesh missing-data/discontinuity handling. `pnpm lint` and `pnpm build` check the app.

Browser checks cover image playback advancing on the globe, controls, relief and city navigation, regular Libre Franklin, desktop/mobile layout and runtime errors. This is a local feasibility review, not a cross-device performance certification. Decoded GOES image references remain bounded to four cache entries with next-frame prefetch. The renderer caps pixel ratio at 1.5 and pauses when the document is hidden.

Run `scripts/prepare-earth.py` with Python, NumPy and Pillow to reproduce the relief and urban derivatives from the archived originals. Original TIFF, JSON and JPEG responses, retrieval dates, source URLs, transformations and SHA-256 hashes are in `public/data/archive/earth/manifest.json`. GOES originals remain in their separate archive. Run `scripts/prepare-cloud-height.py` with Python, NumPy and netCDF4 for ACHA. The original NetCDF files retain all source quality flags, packing metadata and projection parameters. `public/data/archive/cloud-height/manifest.json` records scan start/end, exact URLs, retrieval dates, hashes and transforms.

## Privacy

The GitHub repository is private. Milestone commits and ordinary pushes to `origin/main` are authorized. Public deployment is not authorized. Participant contributions still exist only in the current browser unless exported.

Reproduce regional terrain with `python scripts/prepare-terrain-tiles.py` (NumPy, Pillow). Existing originals are reused. The Rainier manifest records original exports, service/catalogue responses, transforms and all derived hashes. See [STREAMING.md](STREAMING.md).
