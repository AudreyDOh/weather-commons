# Development milestones

## 01 — Workshop pilot

Commit `b339030`: passive-tracer engine, spherical globe, provenance-led historical case, contribution import/export, serif interface, workshop and dataset documentation. Pushed to private `origin/main` on 3 September 2026 UTC.

## 02 — Satellite observation archive

Six genuine NASA GIBS Terra/MODIS daily mosaics, 24–29 September 2024, rendered over the globe. Independent observation date, playback, scrubbing, opacity, source notes and downloadable SHA-256 manifest. One-frame prefetch and a fixed six-image cache; no solver changes or new runtime dependencies. Verify with `pnpm check`, `pnpm lint`, and `pnpm build` before pushing.

## 03 — Cloud appearance and height

Milestone 03 adds approximate GPU cloud isolation, explicit missing-swath explanation, an independent spherical cloud shell, assumed-height and exaggeration controls, and an unambiguous tracer-height caption. Ground-level source imagery remains selectable. Real cloud mask/height retrievals and fully shared depth testing remain open tasks.

## 04 — Softer clouds and scientific typography

Milestone 04 softens the approximate cloud mask, adds labelled visual dissolves between daily cloud frames, stops automatic playback at the archive end, and standardizes the interface on uppercase Franklin-style sans serif with three type sizes. The observation source and physical assumptions are unchanged.

## 05 — GOES instrument view

Milestone 05 adds a dedicated GOES instrument view with GeoColor, Airmass RGB, Sandwich RGB and CO₂ band 16 at matched ten-minute acquisition labels, plus a dated derived-motion-wind plate. Full-colour original imagery, product explanations, pan/zoom, playback speeds, scrubbing, and paired comparison are included. The older 3D lab is retained and its renderer is suspended while the instrument view is open. Source originals and acquisition provenance are archived locally; no live NOAA calls are made by participants' browsers.

## 06 — One Earth, shared depth

Replaces the separate GOES viewer and 2D overlay compositor with a shared Three.js scene. Nominal GOES geographic sampling, full-colour observation playback, sourced ETOPO1 terrain/seafloor, transparent water, atmospheric shells, depth-tested vectors/tracers, and an OSM/NAIP urban sample. White/dark interface, regular bundled Libre Franklin, accessible sliders and revised mobile navigation. Archived inputs, transforms, limits and geometric checks accompany the build. Adds NOAA ACHA cloud-top retrieval geometry, quality masking, independent height scales, a source catalogue, source-sample/building inspection and five guided views. Contextual timelines separate source scans from elapsed simulation time. No solver or deployment change.

## 07 — Continuous navigation and streamed terrain

Adds globe/map/orbit camera behavior in the same scene, progressive tilt, heading-aware panning, pinch zoom, double-click approach and a close-range pan toggle. A real USGS 3DEP/NAIP Mount Rainier archive becomes 85 OGC 3D Tiles with four geometry/texture levels, lazy loading, configured cache/request/parse budgets and coarse fallback. Source inspection and UI labels distinguish current mesh spacing, archived resolution, finite coverage and 1× source heights. Raw responses, catalogue metadata, generation script and geometry/hash checks are included. No solver or deployment change.

## 08 — Public static site

On 2026-11-02 the project lead made the repository public and asked for the pilot to run as a public static page. `STATIC_EXPORT=1` builds a vinext static export, and `NEXT_PUBLIC_BASE_PATH` serves it under a sub-path. `lib/weather/public-url.ts` prefixes root-relative `public/` paths at load time, so the hashed archive manifests stay byte-identical. GitHub Pages publishes it with sketch 02 through the root `scripts/build-pages.mjs` and `.github/workflows/pages.yml`. No solver, data or provenance change.

## Next bounded milestone

Validation for milestones 06–07 is recorded in [VALIDATION.md](VALIDATION.md).

Replace approximate JPEG colour registration with calibrated ABI channel/RGB reprojection and assess parallax against the ACHA layer. Extend regional coverage with calibrated height/reference adapters and extend participant packages beyond wind fields. Preserve scan time, solver time, retrieved height and display exaggeration as separate quantities.

## Recording policy

The project lead requested incremental commits and pushes for coherent, verified milestones. Keep task lists and source notes in the same commit as the implementation. Push normally to the verified remote (public since 2026-11-02). A push to `main` redeploys the GitHub Pages static site. Never force-push, and never publish anywhere else as part of this workflow without separate authorization.
