# 01 · Realtime Weather pilot

Author: Farzin Lotfi-Jam · Started: 2026-09-02 · Status: pilot · Stack: vinext (Next on Vite) + React + three.js, Cloudflare

An evidence-led technical pilot for the Realtime Weather working group. It places a small, documented weather field on a 3D Earth, and keeps four things visibly apart: the source material, the model's rules, the movement it calculates, and the interpretation.

## Run

Online: https://realtimeurbanismlab.github.io/weather-commons/01-realtime-weather-pilot/

On your computer (Node 22.13 or newer, and pnpm), from this folder:

```bash
pnpm install
pnpm dev        # opens at the address it prints
pnpm check      # tests and data checks
pnpm lint
pnpm build
```

Everything the pilot reads is in this folder, so nothing is needed from Box. There are no accounts, no server storage and no live weather feed. Imported contributions stay in your browser until you export them.

## What's on screen

The opening view is a 3D Earth you can turn.

- **Explore** switches between satellite imagery, cloud-top heights, land and seafloor, buildings, and transport and history.
- **Sources** lists every dataset. Click the Earth to inspect the source behind a point.
- **Earth** opens the layer controls:
  - pick a GOES satellite product and play its ten-minute archive;
  - change opacity;
  - look at Atlantic relief;
  - zoom into a small sample of Lower Manhattan buildings.
- **Paper / White** switches to a dark background.
- **The timeline** at the bottom follows the view: dates of satellite frames for imagery, elapsed model time for transport. The two clocks are separate.
- **Conditions → Active study** switches between the two studies.

Satellite colours are NOAA's own processing. Placing the published JPEGs on the globe uses an approximate GOES grid.

Layers:
- **Land and seafloor:** NOAA ETOPO1 elevation as a mesh, with a separate transparent sea surface.
- **City sample:** 522 OpenStreetMap buildings with USGS NAIP aerial imagery.
- **Cloud-top heights:** twelve matched NOAA ACHA grids as a surface, with low-quality data masked. A 0–20 km legend and 1×/20×/50×/100× scales separate the measured value from on-screen exaggeration.
- **Mount Rainier:** USGS 3DEP terrain and NAIP imagery, streamed as 3D Tiles.
- **MODIS:** six NASA Terra/MODIS daily images from 2024, under **Earth → Earlier MODIS archive** (hide GOES first). Their clock is separate from the model's.
- **Cloud isolation** roughly removes dark and strongly coloured pixels. **Cloud mask & height** lifts the image to an assumed height (1×, 50× or 200×). This is a thin image shell, not measured or volumetric cloud. **Original satellite mosaic** restores the flat image.

Models and studies:
- **Transport model:** a fast passive-tracer simulation that runs in the browser. It has documented assumptions, repeatable seeded runs, height, diffusion, decay and grid edges.
- **Two studies:**
  - a synthetic Atlantic teaching field;
  - Project Popeye, using a deliberately limited ERA5 reanalysis snapshot from 1966.
- **Casebook:** marks what is observed or reanalysed, what is assumed, what is calculated, what comes from the archive, and what can't be concluded.
- **Contributions:** wind fields as checked JSON files that participants can import and export.

The Project Popeye study has its own sketch now: [03 · Operation Popeye, Laos 1966–1972](../03-operation-popeye-laos-1966-1972/), a single page in four parts with a week of hourly wind. The casebook here links to it.

## Moving through scales

Choose **Explore → Regional terrain / Rainier**.
- **Approach:** scroll or pinch.
- **Move:** dragging turns the globe from far away, pans at regional scale and orbits up close. **Shift-drag**, or **Use pan**, swaps pan and orbit.
- **Inspect:** double-click a surface to fly to it; click once to inspect its source.
- **Keyboard:** arrow keys pan, Shift-arrows orbit, and + and − zoom.

The Rainier archive covers about 32 km, at four levels of detail. The interface shows the finest mesh spacing on screen: about 487, 244, 122 or 61 m. The sharpest aerial pixels are about 8 m. Zooming further adds no real detail. Terrain height here stays at 1×. See [docs/STREAMING.md](docs/STREAMING.md).

## Files

- [CONTRIBUTING.md](CONTRIBUTING.md): the contribution format and what each contribution must document.
- [docs/WORKSHOP.md](docs/WORKSHOP.md): exercises with the pilot for the workshop sessions.
- [docs/STATUS.md](docs/STATUS.md): what works now and its deliberate limits.
- [docs/DATASETS.md](docs/DATASETS.md): useful sources for imagery, models, ocean and sensing infrastructure.
- [docs/ROADMAP.md](docs/ROADMAP.md) and [docs/MILESTONES.md](docs/MILESTONES.md): what's next and what's done.
- [AGENTS.md](AGENTS.md): rules for people and coding agents working on the pilot.

## Sources and limits

[SOURCES.md](SOURCES.md) lists every source and what it can and can't support. The small source responses and processed files needed to reproduce the case are in this folder. `public/data/archive/manifest.json` records their checksums, source addresses and every change made to them. Every layer states where it comes from, the time it shows, the area it covers, and its limits.

The pilot is not a forecast, a weather-physics model, an exposure assessment, a reconstruction of weather modification, or a decision tool. The Popeye case doesn't attribute rainfall, harm or any outcome to the operation. Its tracers are a hypothetical experiment in a fixed reanalysis wind, not a reconstruction.

## Publishing

The pilot is published as a static page, rebuilt on every push to `main`. It has no server, so nothing a visitor imports leaves their browser. Before connecting participants to a shared online service, we'd need sign-in, private storage, an editorial review step and a clear policy on contributors' data and rights (see [docs/ROADMAP.md](docs/ROADMAP.md)).

To build the static version yourself: `STATIC_EXPORT=1 pnpm build` writes `dist/client/`. Add `NEXT_PUBLIC_BASE_PATH=/weather-commons/01-realtime-weather-pilot` to serve it from a sub-folder. From the repository root, `node scripts/build-pages.mjs` builds the whole site.
