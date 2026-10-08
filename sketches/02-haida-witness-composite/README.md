# 02 · Haida witness composite

Author: Boone Mercado (with Claude) · Started: 2026-10-08 · Status: sketch, v0.2 · Stack: static HTML + JS, no build step

A layered model of the 2012 Haida Gwaii iron dump. The Haida Salmon Restoration Corporation released about 120 t of iron sulphate into an eddy 300 km west of Haida Gwaii in July 2012. A particle simulation (ship, iron, plankton, cloud) runs over a composite of 19 real MODIS Aqua passes from June to October 2012. Each cell of the frame shows the satellite day that best *witnesses* the simulated water under it, so the picture is a collage of many days that reorganises itself as the simulation runs. The idea comes from the Cayuga Matrix collage work (cells assigned to calendar days by rules), with the simulation acting as the rule.

## Run

```bash
cd sketches/02-haida-witness-composite
python -m http.server 8000      # or: npx serve .
```

Open http://localhost:8000. Opening `index.html` as a `file://` page will not work, because the page fetches `cal/index.json`.

Optional: `node ../../scripts/assets.mjs pull 02` copies the raw downloads and fonts from the shared drive into `assets/` (see [assets.json](assets.json)).

## What is on screen

- **Planes** at heights in one orthographic view: composite of days (z 0), cell grid, map (coast, graticule, reported bloom envelope, Haida eddies, ship legs, 200 km bar), sea surface (plankton, iron, ship track), cloud deck (wind-blown particles, drawn only where the assigned day was cloudy), instruments (ship, Aqua sweep line, solid on a pass day). Each plane is one 1800 × 900 canvas, black on transparent.
- **Top / Isometric**: top is straight down with a few degrees of mouse parallax; isometric tilts 35.26° and turns 45°. Alt-drag turns freely, the wheel zooms, F fits, 1 and 2 switch views.
- **Witness** weights decide which pass each cell shows. *The bloom* matches the day's chlorophyll to simulated plankton; *the sky* matches the day's cloud to the simulated deck; *the ship's wake* pulls the pass nearest the moment the ship was there; *the clock* pulls the nearest date. Presets combine them. *Cell size* sets the rule's grain (256 × 128 … 32 × 16 over the frame), and cells refine one level where the water is active.
- **Brush**: Paint a day (B) with the day chosen in the strip, Erase (E) back to the rule, Hide (H) to white, Pick (I or right-click). Strokes sit over the rule.
- **Strip** along the bottom: the 19 passes with a bar for each day's share of the picture.
- **Exports**: Save the view (PNG at the current angle), Cell map (34 × 17 in SVG, one rect per block with `data-day`), Save/Open setup (JSON with the calendar, sim and witness settings, camera and the strokes run-length coded).

## Files

| Path | What |
| --- | --- |
| `index.html` | page and styles |
| `app.js` | calendar loading, simulation, assignment rule, planes, camera, tools, exports |
| `cal/index.json` | the 19 days: date, chlorophyll coverage, cloud fraction |
| `cal/true/`, `cal/thumb/` | MODIS Aqua corrected reflectance, 1800 × 900 and 300 × 150 |
| `cal/chl/` | chlorophyll level per pixel, 900 × 450 grey (0 = no data, 1–255 = low → high), inverted from the GIBS rainbow palette by hue |
| `cal/coast.png` | coastline mask (Worldview Coastlines_15m) |
| `tools/fetch_cal.py` | fetches candidate days from the Worldview snapshot API and keeps the 18 with most chlorophyll coverage plus 20 Jul, 29 Aug, 14 Sep |
| `tools/prep.py` | turns the raw downloads into `cal/` |

Rebuild the calendar: `python tools/fetch_cal.py assets/raw` then `python tools/prep.py assets/raw cal` (needs numpy, Pillow, requests).

## Sources and limits

NASA EOSDIS GIBS / Worldview, MODIS Aqua, public domain. Frame 49–58° N, 145–127° W, equirectangular (EPSG:4326), about 1.1 km per pixel at 1800 × 900. The cloud fraction per cell is a brightness/saturation threshold on true colour, an approximation of a cloud mask. Chlorophyll values are read back from the rendered palette, so they are relative levels, not mg/m³.

The simulation is illustrative. The eddies are placed as the Haida eddies of 2012 and turn clockwise; growth and grazing are tuned by eye. The simulated bloom peaks near 40,000 km² against the ~10,000 km² reported, which still needs calibration. Carbon export is fixed at 12 % of grazed carbon. Nothing here attributes salmon returns or any other outcome to the release.

Links in the header point to the geoengineering catalog and the five-technique model, both private claude.ai artifacts for now.
