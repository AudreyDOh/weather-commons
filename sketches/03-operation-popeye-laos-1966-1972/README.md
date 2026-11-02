# 03 · Operation Popeye, Laos 1966–1972

Author: Farzin Lotfi-Jam (with Claude) · Started: 2026-11-02 · Status: sketch · Stack: static HTML + JS, no build step

The US military's secret cloud seeding over Laos, told in four parts: what happened, where the weather went, who and what it touched, and what we can and can't say. It asks what it means to turn a rainy season into a weapon, when rain does not stay over a road or inside a border.

Forked from sketch 01 on 2026-11-02. Sketch 01 is the multi-layer technical pilot. This sketch keeps only the Popeye case and rebuilds it as a single page that's easy to read and adapt.

## Run

Online: https://realtimeurbanismlab.github.io/weather-commons/03-operation-popeye-laos-1966-1972/

On your computer:

```bash
cd sketches/03-operation-popeye-laos-1966-1972
python -m http.server 8000
```

Then open http://localhost:8000. Opening `index.html` as a file won't work, because the page loads `data/`.

## 1. Event

From the 1967 State Department memo: October 1966 tests in the Se Kong valley, carried out without asking the Lao government, and a plan to seed clouds along the supply routes "to inhibit overland vehicular movement". From later accounts: seeding every rainy season until 1972. Then the press reports, the 1974 Senate hearing and the ENMOD treaty (1976–1978). Each item on the page is tagged *Documented* or *Reported*, so you can see which source carries it.

## 2. Simulate

1,500 dots start in a 25 km circle at the Se Kong valley and drift for a week (1–7 October 1966) with hourly ERA5 wind 100 m above the ground, plus random spread for turbulence. Click the map to release them elsewhere.

The model shows where the air went, not what seeding did: no clouds, rain, mountains or height. The rainfall chart shows the end of the 1966 monsoon at the test site, the season Popeye was meant to stretch.

## 3. Situate

A numbered map and list:
- the test area;
- the supply routes, described but not drawn, since there is no sourced map;
- the reported air base at Udon Thani;
- Đồng Hới, named in the memo;
- the Mekong flood the memo worried about;
- nearby towns.

Places off the map, in Washington, China Lake and Geneva, are listed below the map. The legacy of the wider bombing (UXO) is kept separate from the seeding.

## 4. Narrate

A short interpretive paragraph, then a ledger that sorts each claim: documented, reported, reanalysed, calculated, or not known.

## Files

| Path | What |
| --- | --- |
| `index.html` | the page: all text, in the four parts |
| `app.js` | map drawing, the wind-drift simulation, the rainfall chart and the places. Settings and places are at the top |
| `style.css` | the shared Realtime Weather look (a copy of `site/style.css`) |
| `data/wind.json` | hourly wind on a 1° grid, 102–110° E, 12–19° N, 1–7 October 1966 (m/s) |
| `data/rain.json` | daily rainfall at the Se Kong valley, September to November 1966 (mm) |
| `data/map.json` | coastlines, borders, rivers and towns, clipped to the area |
| `data/raw/` | the ERA5 responses exactly as downloaded |
| `data/manifest.json` | request addresses, download time and SHA-256 of every data file |
| `tools/fetch-weather.mjs` | downloads the wind and rainfall again (Node 18+) |
| `tools/prepare-map.mjs` | downloads and clips the map layers again (Node 18+) |

## Make it your own event

This sketch is built to be copied. To make one for another event, for example cloud seeding over the Sierra, hail cannons in Mendoza or a 1950s rainmaking trial:

1. **Start your sketch:** `node scripts/new-sketch.mjs "Your event" --number NN --author "Your Name"` from the repository root. Or ask Claude to "start a sketch based on sketch 03".
2. **Copy** `app.js`, `tools/` and the structure of `index.html` from this folder into yours.
3. **Choose your place and time.** In `tools/fetch-weather.mjs`, set `SETTINGS`: the area (keep it under about 100 grid points), the days (ERA5 starts in 1940), and the place for daily rainfall. In `tools/prepare-map.mjs`, set `AREA` a little larger than the wind grid.
4. **Get the data:** from your sketch folder, run `node tools/fetch-weather.mjs` and `node tools/prepare-map.mjs`.
5. **Set the start.** In `app.js`, change `SETTINGS` (the map area, release point, towns to label) and `PLACES` (your places, each with what kind of evidence locates it and which source).
6. **Write the four parts** in `index.html`. Tag every claim: *Documented* for primary sources, *Reported* for later accounts, *Reanalysed*, *Synthetic*, *Calculated* or *Interpretive*. Number your sources in **Sources and limits**.
7. **Run the simulation before you write the story.** Let what the wind actually did shape the narrative, not the other way round.

Ideas for going further:
- show a second week, a different season or the year before, for comparison;
- add the rainfall over the whole grid as a map layer (Open-Meteo `daily=precipitation_sum`);
- compare a seeded and an unseeded season, if your event has one.

## Sources and limits

1. **Kohler to Rusk memorandum, 13 January 1967.** FRUS 1964–1968, vol. XXVIII, Laos, doc. 274. https://history.state.gov/historicaldocuments/frus1964-68v28/d274
   - Primary source, and the base for every *Documented* item about the operation: tests (¶2), aims (¶5), unpredictability (¶4), named populated areas (¶10), crop and flood risks (¶10–11), the September 1966 Mekong flood (¶13).
   - It records the government's own claims and plans. It is not an independent test of them.
2. **"Operation Popeye", Wikipedia,** read 2026-11-02. https://en.wikipedia.org/wiki/Operation_Popeye
   - Secondary source for the 1967–1972 operation, the Udon Thani base, the seeding agents, the press reports and the 1974 Senate hearing.
   - Its own sources (a 1974 Defense Department report, the hearing record, newspapers) were not read for this sketch.
3. **Seymour M. Hersh,** *New York Times*, 3 July 1972, as cited in 2. Not read here.
4. **ENMOD,** UN Treaty Collection, chapter XXVI-1: adopted 10 December 1976, opened for signature 18 May 1977, in force 5 October 1978.
5. **UNDP, "Unexploded ordnance, an obstacle to development",** UN Lao PDR, 4 April 2018. https://laopdr.un.org/en/14539-unexploded-ordnance-obstacle-development
   - More than 60,000 ha of confirmed hazardous areas identified since 2015.
   - This is a bombing legacy, kept apart from seeding.
6. **ERA5 hourly reanalysis** (Hersbach et al., ECMWF, doi:10.24381/cds.adbb2d47), via the Open-Meteo historical API (doi:10.5281/zenodo.7970649), CC BY 4.0.
   - Downloaded 2026-11-02; exact requests and checksums in `data/manifest.json`.
   - Transform: wind speed and direction turned into east and north components (u = −speed·sin(direction), v = −speed·cos(direction)), rounded to 0.01 m/s.
   - *Reanalysed*: a model's best estimate from historical observations, which were sparse over 1960s Laos. Not a measurement at each grid point.
7. **Natural Earth 1:10m** coastlines, land borders, rivers and populated places, public domain. https://www.naturalearthdata.com/
   - Present-day cartography, clipped to 100–112° E, 10–21° N, rounded to 0.01°.

**What this sketch cannot show:**
- whether seeding added rain, closed any road or harmed anyone;
- where the supply routes ran;
- the weather after 7 October 1966, or above 100 m.

The Se Kong test area is placed approximately. Distances from dots to towns are calculated, not exposure. The simulation leaves out terrain, rain, clouds, vertical motion and any effect of seeding.
