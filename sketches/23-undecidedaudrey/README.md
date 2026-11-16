# 23 · Two asks at Daegwallyeong

Author: Audrey Doh · Started: 2026-11-02 · Status: sketch · Stack: static HTML + JS

Snow-making by cloud seeding at Daegwallyeong in Korea's Taebaek Mountains (2006, 2008–2010), read beside the mountain-god rites held at the same pass. A map plays the reanalysed 2006 wind over the pass and shows where it could have carried the seeding material.

## Run

Online: https://audreydoh.github.io/weather-commons/23-undecidedaudrey/

From this sketch folder:

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. No packages or build step are needed. Opening `index.html` as a `file://` page will not work, because the page loads its files from `data/`.

Rebuild the data (needs Python 3 and curl, no packages):

```bash
python3 tools/fetch_weather.py   # daily ERA5 winters 1980-2010
python3 tools/pick_days.py       # candidate days, snow around them, winter totals
python3 tools/fetch_weather.py   # again, for the hourly wind on the candidate days
python3 tools/fetch_map.py       # terrain and places
```

## 1. Event

**Case:** cloud seeding to increase snowfall in the Taebaek Mountains, South Korea, in 2006 and from 2008 to 2010. According to the Geoengineering Map, there were nine ground-based snow-enhancement experiments in January and February 2006, and 20 airborne experiments in winter and early spring from 2008 to 2010. The materials used were silver iodide (AgI), calcium chloride, water vapour, aircraft, flare generators and solid dispersal. The same map entry lists two earlier phases: the Andong catchment area (1995–1996) and Gyeongnam Province (2000–2006).

**Where:** "Taebaek Mountains" means the mountain range, not the peak Taebaeksan. The 2006 ground experiment was at **Daegwallyeong**, a pass in the range above Pyeongchang and Gangneung (Lee et al. 2009). The 2008–2010 flights were also over the Daegwallyeong and Yongpyeong area, according to later Korean papers. The research institute of the Korea Meteorological Administration ran them.

**Why this case:** Daegwallyeong is also where the Gangneung Danoje festival begins, with rites to the mountain god (Daegwallyeong Sansinje) and the guardian deity (Guksaseonghwangje). On the same pass, people have asked the sky for weather in two languages: ritual and silver iodide. This sketch does not test whether the rites work. It asks how each one tells whether the sky has answered.

**Working question:** how did the 2006–2010 Daegwallyeong seeding experiments decide when to seed and whether the seeding worked, and how does that compare with the way the rites at the same pass read the sky?

Sub-questions to narrow next:
- Which days, places and clouds were chosen for seeding, and what did radar or satellites show on those days?
- How did the researchers separate snow caused by seeding from snow that would have fallen anyway? This is called attribution.
- What do sources on the Daegwallyeong rites say about weather, snow, rain or harvest?

## 2. Simulate

**Candidate days.** The exact 2006 experiment days are in the paywalled full text of Lee et al. 2009. Its abstract says the experiments ran on easterly, foggy days with high humidity. `tools/pick_days.py` applies that as a rule to daily ERA5 values for the cell over Daegwallyeong: dominant 10 m wind from 45–135°, daily mean humidity of 80 % or more, and a daily mean temperature of 0 °C or below. In January–February 2006 this picks 18, 19 and 31 January. These are candidate days, not confirmed experiment days. The coarse cell cannot see fog at the pass, which is probably why it finds three days, not nine.

**The map** (`map.js`). Particles are released at random inside a circle of 3 km around the pass, because the generator site is not public. Each step is 40 seconds of weather. A particle moves with the 10 m wind, interpolated bilinearly between the 0.25° ERA5 cell centres and linearly between hours, plus a uniform random spread of up to 60 m per axis. It is followed for 3 hours. On all three candidate days, a particle leaving the pass at noon travels 19–28 km west-south-west in 3 hours, towards Yongpyong and Pyeongchang. Particles do not rise, fall, freeze, settle or follow the terrain, and they do not stand for mass. The 60 m spread and the 3 hours are choices, not measurements.

**A first result** (`data/epoch.json`, not yet on the page). The same rule applied to the 52 matching days in the winters 1980–2005, before any seeding at Daegwallyeong, gives a mean of 7.3 cm of ERA5 snowfall on the day itself, against 0.9 cm on an average winter day. Changing the rule (wind 30–150° or 0–180°, humidity 75–85 %) keeps it between about 6 and 8 cm. So the conditions chosen for seeding already pick snowy days. Any effect of seeding has to be found on top of that.

## 3. Situate

Places and institutions to research. Only the map entry and the first papers support these so far.

- **Daegwallyeong:** the site of the 2006 ground experiment and the target area of later flights.
- **Daegwallyeong Sansinje and Guksaseonghwangje:** the rites at the pass that open the Gangneung Danoje festival. Their links to weather need sources.
- **Korea Meteorological Administration and its research institute** (the Meteorological Research Institute, now the National Institute of Meteorological Sciences): they ran the experiments.
- **The cloud physics observation site at Daegwallyeong:** reported by the Korea Times as built in 2003 to measure clouds before and after seeding. This needs a primary source.
- **Weather radar and satellite records** for the seeding days, if they can be found.

## 4. Narrate

This is the starting page for a personal workshop project. It shows how an invented movement rule becomes an animation. It makes no claims about an actual weather event or its effects.

## Sources and limits

- **Geoengineering Map, entry "South Korea Cloud Seeding"** (id 5585), ETC Group and Heinrich Böll Foundation: https://map.geoengineeringmonitor.org/wm/south-korea-cloud-seeding. Read on 2026-11-09. Licence: CC BY-NC-ND 4.0, so this sketch links to and summarises the entry rather than copying its data. Type: a secondary record of observed activities, compiled by the map's makers. By its makers' own account the map is partial.
- **Lee et al. 2009**, "Preliminary results of the ground-based orographic snow enhancement experiment for the easterly cold fog (cloud) at Daegwallyeong during the 2006 winter", *Advances in Atmospheric Sciences* 26: 222. Abstract: https://ui.adsabs.harvard.edu/abs/2009AdAtS..26..222L/abstract. Found 2026-11-09; only the abstract has been read. Type: a scientific report of observed experiments.
- **"Current state of cloud seeding in Korea"**, conference abstract, American Meteorological Society 91st Annual Meeting, 2011: https://ams.confex.com/ams/91Annual/webprogram/Paper188294.html. Reports 20 airborne experiments, mostly over the Taebaek range. Found 2026-11-09; not yet read in full.
- A longer list of Korean and English sources to read is in NOTES.md.
- **Sources cited by the map entry, not yet read:** the WMO Register of National Weather Modification Projects for 1996 and for 2001–2002, and the WMO weather modification register (https://community.wmo.int/en/wx-mod-register). These should be read for dates, sites and results.
- **ERA5 reanalysis** (Hersbach et al. 2020; Copernicus Climate Change Service), through the Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api. Fetched 2026-11-16. Licence CC BY 4.0. Type: reanalysed. Daily values for the 0.25° cell centred 37.75 N, 128.75 E for January–February 1980–2010 (`data/winters.json`), and hourly 10 m wind on a 5 × 5 block of cells for the candidate days (`data/wind-2006.json`). Changes: kept January and February only; derived candidate days, snow profiles and winter totals (`tools/pick_days.py`).
- **Terrain:** Copernicus DEM GLO-90 (© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA), through the Open-Meteo Elevation API, sampled on a 0.01° grid. Fetched 2026-11-16. Type: cartographic.
- **Places:** © OpenStreetMap contributors (ODbL), looked up 2026-11-16, and the NOAA GHCN-Daily station list for the Gangneung station (KSM00047105). Each point's origin is in `data/places.json`.
- **Not used:** the Daegwallyeong station record from the Korea Meteorological Administration needs a login, and NOAA GHCN-Daily has no Daegwallyeong station and gaps at Gangneung in 2006. So there are no observations on the page yet.
- **Realtime Weather starter template**, Realtime Urbanism Lab, `sketches/_template/index.html` at repository revision `613d7f6` (copied 2026-11-02): https://github.com/RealtimeUrbanismLab/weather-commons/tree/613d7f6/sketches/_template. Code: MIT. Original text: CC BY 4.0. Type: synthetic and illustrative. Its synthetic wind animation was replaced on 2026-11-16 by the map.
- **Ritual and historical sources:** none yet. When they are added, they will be labelled interpretive or historical, and kept apart from measured data.

The model calculates where particles carried by the reanalysed 10 m wind would be, hour by hour. It cannot establish where silver iodide went, how much snow fell at the pass, whether the seeding worked, whether the rites did anything, or any harm to people or ecosystems. ERA5 averages over about 25 km, so it misses the way air is forced up and around the pass, which is what the experiments relied on.
