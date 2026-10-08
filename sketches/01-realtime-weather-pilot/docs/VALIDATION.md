# Milestone 06 validation

Local review on 3 September 2026. This records tested behaviour, not a cross-device performance certification.

## Automated gates

`pnpm check` verifies TypeScript, transport invariants, contribution validation, historical API transforms, original imagery hashes/cadence, relief dimensions and signed elevations, coordinate/height scale, and building provenance. The ACHA checks verify twelve original and derived hashes, scan-window matching, valid height bounds/navigation, and exclusion of missing samples and large height jumps from triangles.

`pnpm lint` and `pnpm build` pass. The build reports a large-client-chunk advisory; Three.js and the scene remain a substantial part of the initial app bundle. This is a known optimization opportunity, not a build failure.

## Browser review

Chromium with WebGL, desktop 1440 × 960 and mobile 390 × 844:

- GOES observation playback advances the source frame, independently of the tracer clock.
- Cloud-height playback advances; true-scale and exaggerated geometry render without WebGL errors.
- A clicked cloud triangle returns the nearest retained source sample. A reviewed example returned 11,641 m at 24.535°N, 58.809°W, scan 04:10:20–04:19:51 UTC. The inspector labels its quality rule and height reference.
- A relief click returned a signed source-grid sample. A building click selected One World Trade Center and its OSM-tagged 417 m extrusion height, with a link to the original way.
- The source drawer, white/dark themes, layer controls, city/relief presets and Conditions panel were inspected. The Conditions panel uses 14 px regular text at full opacity.
- Mobile has no horizontal document overflow; the observation scrubber occupies 240 px in the reviewed imagery view. Regular bundled Libre Franklin resolves at weight 400.
- No browser page errors or console errors were reported during these interactions.

## Remaining validation work

- Independently calibrate source JPEG navigation against raw ABI geolocation and assess cloud parallax before precise cross-layer spatial claims.
- Test on integrated GPUs, touch devices and lower-bandwidth connections before a workshop release.
- Replace overview relief and the local flat city datum before street-scale analysis. Assess footprints, imagery dates and height conventions for each new city sample.
- Test persistent participant storage and permissions once those services exist; this local pilot has no shared accounts or contribution backend.

## Milestone 07: navigation and regional streaming

`pnpm check` additionally verifies every Rainier source/derived hash, 85 GLB headers and buffer layouts, four quadtree levels, transforms against source-grid heights within 1 m at selected surface vertices, geographic bounds, longitude wrapping, camera-mode thresholds, continuous tilt and heading-aware pan math.

Chromium/WebGL desktop review exercised globe → map → orbit, orbit drag, wheel approach, the city pan toggle, single-click terrain inspection and double-click approach without an unwanted inspector. The reviewed terrain click returned an archived 4,144 m sample. No regional GLBs were requested in the initial globe view; the Rainier preset initially requested five tiles, then refined from ~244 m to ~61 m mesh spacing on approach. A 390 × 844 viewport had no horizontal document overflow. No page errors occurred in these interactions.

A deliberate network failure blocked level 2/3 GLBs. The app retained the five downloaded ancestors in cache; when the tile renderer reported zero visible regional tiles, the global overview remained available. The status showed the failure and actual visible/cache counts. Re-entering after restoring the connection cleared the error and rendered regional detail again. This checks overview fallback, not a guarantee that the tile library always draws a regional ancestor after every failure. Coverage disclosure initially intercepted no clicks because of inherited pointer-event styling; this was corrected and retested. Physical-device pinch ergonomics and low-end GPU memory still require workshop hardware testing.

The regional archive boundary remains visibly distinct against the coarse global overview. It is a finite coverage sample, not seamless worldwide terrain. The cache settings are estimated eviction targets; observed request counts are not simultaneous resident-tile counts. The existing large-client-chunk build advisory remains an optimization task.
