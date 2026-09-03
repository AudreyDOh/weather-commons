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
