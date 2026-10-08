# Four-part working group structure

The aim is a collective atlas of how weather becomes legible, governable, and contestable. Each group contributes a bounded field rather than attempting a universal model of the planet.

## Session 1 — Situate a field

Choose a weather system, measurement practice, or contested intervention. Make a source ledger: what is measured, reanalyzed, modelled, synthetic, mapped, and narrated? Locate instruments, institutions, computational sites, and affected landscapes. Leave with a one-page research question and a small source pack.

## Session 2 — Build a limited simulation

Convert a documented field into the contribution schema, or begin with the uniform teaching field. State resolution, timestamp, units, interpolation, missing-data policy, and every transformation. Build one small transport or visual experiment. The result should be falsifiable and legible, not comprehensive.

## Session 3 — Connect infrastructure and consequence

Place the model in its material geography: sensors, satellite ground stations, forecasting centres, airfields, archives, rivers, settlements, military logistics, legal jurisdictions, or supply chains. Separate calculated proximity from any claim about people or environments. Pair the model with a narrated sequence of locations.

## Session 4 — Publish a contribution

Present an evidence-led scene: source, model rule, calculated output, geographic context, interpretation, and limit. Assemble a contribution package for the shared globe and a short public explanation. Peer review checks provenance, readability, and overclaiming before publication.

## Participant roles

Groups of two to four work well: a data steward documents sources and transforms; a modeller builds or checks the field; a spatial researcher maps infrastructure and geography; a writer/editor develops the narrative and claim ledger. Roles can overlap.

## Minimum contribution package

1. A validated JSON field and parameter set.
2. A source ledger with URLs, dates, licenses, processing steps, and unknowns.
3. Three to five geographic or institutional waypoints.
4. One statement of what the simulation calculates and one statement of what it cannot establish.
5. A short narrative suitable for the casebook.

## Facilitation

Begin each session by comparing a real observation, a model product, and a synthetic teaching field. Keep a shared vocabulary for `observation`, `reanalysis`, `forecast`, `simulation`, `visualization`, and `interpretation`. Ask groups to make their uncertainty visible as part of the form, rather than smoothing it away.

## Pilot exercise: two clocks

Explore → Satellite imagery adds an exercise in comparative observation: pause a single acquisition label and compare GeoColor with Airmass RGB. Name three features that change appearance and explain which measurement/processing choice produced that change. Then compare the original derived-wind plate and identify the extra inference needed to turn tracked cloud features into a wind retrieval. The wind still has its own source time and cannot be treated as a matched-time image pair.

Open Earth → Earlier MODIS archive, hide GOES and choose Show. Play the six Terra/MODIS daily mosaics while the tracer model is paused, then pause the imagery and run the simulation. Ask participants what changed in each case and what evidence would justify linking them. Lower imagery opacity to identify where the 2004 background is being shown underneath missing 2024 coverage. Locate a cloud system, record its observation date, and explain why its image alone does not supply wind vectors or cloud height. The mismatch with the 1966 case is deliberate and labelled: a source date must be part of every spatial claim.

## Pilot exercise: one Earth, five kinds of evidence

Use **Explore** as a 20-minute opening exercise. Change one variable at a time and keep a small claim ledger.

1. **Satellite imagery:** pause 04:10 UTC. Switch Air Mass / GeoColor without changing the date. What becomes legible because of a channel combination? The colours are processed observations, not natural vision of an atmosphere.
2. **Cloud-top heights:** select the same scan. Compare 1× with 50× height. Click a patch and record its retrieval, scan interval and DQF rule. Explain why an attractive continuous mesh would conceal missingness. Cloud tops do not define a cloud's full volume.
3. **Land + seafloor:** lower water opacity and compare 1×/60× relief. Click a deep-ocean point. Distinguish metres in the source from apparent depth on screen. Ask whose observations and interpolation assembled that global surface.
4. **Built fabric:** inspect three buildings. Find a tagged height and, if present in the selected sample, an assumed height. Explain how a cadastral-style outline, an aerial photograph and a height convention become a model of architecture. Record the mismatch in source dates and the flat datum.
5. **Transport + history:** open Read, then Conditions. Change one transport parameter and rerun with the same seed. Pair a calculated difference with an archival claim; write the missing evidence needed to connect them. Never turn simulated proximity into weather-modification effectiveness or harm attribution.

For the final presentation, require one inspected record, one transformation diagram, one counterfactual rerun, and one explicit non-inference. Scientific precision here means making the source/algorithm/display distinction readable, including when the display is beautiful.

## AI-assisted work protocol

Give Codex a bounded source pack, a declared question and a maximum client data size. Ask it first to identify units, axes, time coverage, missing-data codes and licensing from the original metadata. Have it produce a small derived field plus reproducible transform and manifest. Ask a second human participant to inspect a few source values and trace a narrative claim back to its document before accepting the output. Never let plausible generated numbers stand in for observations. Imported JSON remains data only; executable student modules are not supported by this pilot.

The current adapter examples are `prepare-earth.py` and `prepare-cloud-height.py`. A future participant layer schema should include source kind, archive/version, geographic and vertical reference, acquisition interval, display transform, missingness, narrative waypoints and rights. These broader layer packages are a roadmap item; current participant imports still accept the validated wind-field contribution schema.

## Exercise: what changes when we zoom?

Start at the globe and approach **Regional terrain / Rainier**. Compare the current displayed mesh spacing with the finest archived elevation sample and aerial pixel size. Orbit the summit, pan into a valley, inspect a source elevation, then find the archive boundary. Ask participants to distinguish apparent photographic detail, geometric detail, a sampled source height and the hidden seam geometry. Which claims survive a change of scale?

One group can document the 3DEP elevation production chain; another can inspect the NAIP catalogue and differing dates; a third can explain how tiling, memory budgets and camera position decide what becomes visible. Each contribution should include its coverage, acquisition dates, horizontal/vertical reference, provenance and permissible inferences. Terrain is not yet coupled to transport: a valley-shaped plume or runoff claim would require additional equations and validation, not a visual reading of the mesh.

A future participant layer package should declare a versioned tileset/imagery manifest, source category, footprint, resolution range, coordinate/height reference, time range, attribution, narrative waypoints and licensing. This is a proposed schema extension; current JSON imports do not execute code or load arbitrary tile manifests.
