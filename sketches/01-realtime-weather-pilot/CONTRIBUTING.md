# Bring a contribution
Open Contribute in the application. Download the JSON template, edit it with Codex or your editor, then Load contribution. A valid file immediately supplies the title, investigation, narrative locations and simulation configuration. Import replaces the current contribution; export your existing work first.

## Required fields
schemaVersion: 1
id: stable short identifier
title, author, description: plain text
kind: idealized or gridded
source: title, HTTP(S) url, license, note
parameters: wind (0–40), diffusion (0–100000 m²/s), lifetime (6–120 h), longitude (-180–180), latitude (-70–70), seed (unsigned integer)
chapters: 1–12 objects containing label, title, text, longitude, latitude and optional HTTP(S) source.
Unknown run metadata from an export is ignored by simulation initialization.

## Wind grids
For kind gridded, supply grid with width, height, west, south, dx, dy, units: m/s, and u/v arrays.
- u is eastward velocity; v is northward velocity.
- Array layout: south-to-north rows, west-to-east columns; index = row * width + column.
- Positive dx and dy are angular degrees. The last point is west+(width-1)*dx, south+(height-1)*dy.
- Extent may not cross the antimeridian. Maximum 180 × 90 grid points; upload cap 2 MB.
- All values must be finite, between -150 and 150 m/s. Missing values need an explicit upstream treatment documented in source.note; do not silently turn them into zero wind.
- One stationary field only in this pilot. Record its valid time, altitude/pressure level, native resolution, and how it was derived in source.note.
- At the default control value 18 the grid is unscaled. The Wind multiplier control scales velocities by wind / 18.
- Tracers leaving the grid are removed (absorbing boundaries). Mass loss then reflects both decay and boundary loss. Place the entire release cloud inside your domain.
- Use public/examples/uniform-grid.json to verify orientation and units before supplying a new field.

## Scientific provenance checklist
Record producer, dataset version, valid time, retrieval time, coordinates, units, transformations, interpolation, license and limitations. Distinguish observations, retrievals, reanalysis and forecasts. Do not call a synthetic field observed data. Narrative claims need inspectable source links.

## A useful Codex prompt
Read README.md, CONTRIBUTING.md and lib/weather/types.ts. Copy the example contribution into a new JSON file. Preserve the schema, validate units and coordinate order, and keep any existing source notes. Change the inquiry and narrative stops to my documented case. If I provide a wind field, inspect its metadata before converting it. Do not fabricate observations or source citations. Explain every transformation, then verify the JSON with validateContribution. Keep all changes in the contribution file.

## New simulation engines
To add a physically different engine, introduce an explicit engine identifier and validation path, implement the numerical operator independently of React, and adapt the worker message protocol. The current import contract accepts fields and narrative data, not arbitrary uploaded code. Preserve a known reference case and define time units, domains, boundaries and diagnostics before adding controls.


## Optional vertical transport (backward-compatible schema v1)

parameters.releaseHeight: 0–12000 metres above the reference sphere (default 0). parameters.verticalDiffusion: 0–50 m²/s (default 0). Existing contributions retain their horizontal motion; an independent random stream calculates vertical mixing. Height reflects at 0 and 12 km, without mass loss at those boundaries. This is not height above terrain or a pressure coordinate. Document the assumption that your horizontal field is applied at every height. Do not interpret this as using a supplied vertical wind or a multilayer weather dataset.

Run exports add heightsMetres (one per particle), model and heightReference. Globe exaggeration never changes this array. Evidence content must distinguish observed inputs, model-derived fields and synthetic assumptions.

Optional parameters.releaseRadiusKm (1–300 km) controls the initial disk. Omit it to preserve the original 1.7-degree angular radius. The archival example uses 25 km; this is a hypothetical release footprint. Keep reconstructed weather distinct from a reconstruction of a historical intervention.
