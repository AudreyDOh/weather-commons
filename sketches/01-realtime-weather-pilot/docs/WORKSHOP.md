# Exercises with the pilot

How the workshop runs (the four parts Event, Simulate, Situate, Narrate, peer feedback and vocabulary) is in [docs/workshop/README.md](../../../docs/workshop/README.md). This page holds exercises that use this pilot. Open it at https://realtimeurbanismlab.github.io/weather-commons/01-realtime-weather-pilot/.

Start a session by comparing three things side by side: a real observation, a model product and a made-up teaching field.

## One Earth, five kinds of evidence (20 minutes)

Use **Explore**. Change one thing at a time, and keep a short list of claims and what supports them.

1. **Satellite imagery.** Pause at 04:10 UTC. Switch between Air Mass and GeoColor without changing the time. What becomes visible because of how the channels are combined? These colours are processed measurements, not what an eye would see.
2. **Cloud-top heights.** Pick the same scan. Compare 1× with 50× height. Click a patch and note its retrieval, scan time and quality rule. Why would a smooth, continuous surface hide missing data? Cloud tops don't tell you a cloud's full volume.
3. **Land and seafloor.** Lower the water opacity and compare 1× with 60× relief. Click a point in the deep ocean. What is the depth in metres in the source, and what does the screen show? Whose measurements and interpolation built this global surface?
4. **Built fabric.** Inspect three buildings. Find a height taken from tags and, if the sample has one, an assumed height. How do an outline, an aerial photo and a height rule become a model of architecture? Note the mismatch in source dates and the flat ground level.
5. **Transport and history.** Open **Read**, then **Conditions**. Change one setting and run again with the same seed. Pair a calculated difference with a claim from the archive, then write down the evidence that would be needed to connect them. Never treat simulated nearness as proof that weather modification worked or caused harm.

For the final presentation, ask each participant for:
- one inspected record;
- one diagram of how the data was transformed;
- one rerun with a changed setting;
- one thing the model explicitly cannot show.

Being precise here means making the difference between source, calculation and display easy to read, even when the picture is beautiful.

## Two clocks

The imagery has its own time, separate from the model's time.

- **GOES.** In **Explore → Satellite imagery**, pause on one time and compare GeoColor with Airmass RGB. Name three features that look different, and say which measurement or processing choice causes it. Then look at the derived-wind plate: what extra step turns tracked cloud features into wind? The wind has its own time, so it isn't a matched pair with the image.
- **MODIS.** Open **Earth → Earlier MODIS archive**, hide GOES and choose **Show**.
  - Play the six Terra/MODIS daily images while the model is paused. Then pause the images and run the model. What changed each time, and what evidence would link them?
  - Lower the image opacity to see where the 2004 background shows through gaps in the 2024 coverage.
  - Find a cloud system and note its date. Why doesn't the image alone give you wind or cloud height?
- **Mismatched dates.** The mismatch with the 1966 case is deliberate and labelled. Every spatial claim needs a source date.

## What changes when we zoom?

Start at the globe and approach **Regional terrain / Rainier**.

- **Compare** the mesh spacing on screen with the finest elevation sample in the archive and the aerial pixel size.
- **Explore** the archive: orbit the summit, pan into a valley, inspect a source elevation, then find the edge of the archive.
- **Tell apart** detail in the photograph, detail in the geometry, a sampled source height, and the hidden seams between tiles.
- **Ask:** which claims still hold when the scale changes?

Pick one angle to follow up:
- how the 3DEP elevation data was produced;
- the NAIP imagery catalogue and its varying dates;
- how tiling, memory limits and camera position decide what you see.

Record:
- the coverage;
- the acquisition dates;
- the horizontal and vertical reference;
- where the data came from;
- what can and can't be concluded.

Terrain isn't connected to the transport model yet. A claim that a plume or runoff follows a valley would need more equations and testing, not just a visual reading of the mesh.

## Importing data into the pilot

The pilot imports wind fields in its contribution format (see [CONTRIBUTING.md](../CONTRIBUTING.md)). Imported JSON is treated as data only and never run as code.

A future layer format could also declare:
- source type, archive and version;
- geographic and vertical reference;
- time range;
- display changes;
- missing data;
- places in the story;
- rights.

That format is on the roadmap.
