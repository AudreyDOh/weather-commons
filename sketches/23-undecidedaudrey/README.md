# 23 · Two asks at Daegwallyeong

Author: Audrey Doh · Started: 2026-11-02 · Status: sketch · Stack: static HTML + JS

When people ask the sky for weather, in a rite or with an aircraft, and the weather comes, who made it happen? Eight cases, each in four parts (the ask, what followed, who claimed what, what cannot be known): Daegwallyeong 2025 at length, and Dubai 2024, Mandalika 2022, Bhopal 2019, Utah 2021, Beijing 2008, Lahore 2023 and San Diego 1916 in short. The page now shows only two speculative skies for Daegwallyeong; everything else is kept, unchanged, in a folded Archive below it. At Daegwallyeong, in the Gangneung drought of 2025, a rain rite was held at the mountain-god shrine (23 August) and the Korea Meteorological Administration flew seeding aircraft (from 26 August).

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
python3 tools/case_2025.py       # the 2025 events, rain and late-August baseline
python3 tools/power.py           # trials needed to tell an effect from chance
python3 tools/skies.py           # the 72 skies
python3 tools/galton.py          # the drops for the Galton sky
python3 tools/days.py            # daily rain and cloud, Aug-Sep 1940-2025, for the speculative skies
python3 tools/zoom.py            # hourly rain for 13 September 2025
python3 tools/fetch_weather.py   # again, for the hourly wind on the map days
python3 tools/fetch_map.py       # terrain and places
```

## 1. Event

**Seven short cases** (from news reports and secondary accounts, read 2026-11-16; summarised, not computed):

- **Dubai, 16 April 2024.** About 254 mm in under 24 hours at Khatm Al Shakla, the most since records began in 1949. The National Center of Meteorology denied seeding during the event; a spokesman later told Bloomberg it seeded on 14–15 April. World Weather Attribution: storms like it 10–40 % heavier today. Sources: Gulf News; CNBC; Down to Earth; Bloomberg 2025.
- **Mandalika, 20 March 2022.** Rain handler Rara Istiani Wulandari on the MotoGP track; BRIN, BMKG and the air force ran weather modification for 18–20 March. Rain delayed the race about an hour, then stopped. BRIN credited its techniques; BMKG's deputy for meteorology said the forecast had the rain ending around 16:15 and called the ritual's timing coincidence. Sources: Al Jazeera; Bisnis.com; GridOto.
- **Bhopal, 19 July and 11 September 2019.** Clay frogs married for rain by Om Shiv Seva Shakti Mandal, divorced eight weeks later as floods came; Bhopal 81 % above normal rain by September (IMD official, quoted). Sources: Onmanorama; The Logical Indian; ETV Bharat.
- **Utah, 4–6 June 2021.** Governor Cox's weekend of prayer for rain. Only an opinion column reports light showers that weekend; no measured account found. 2023: a day of prayer and thanksgiving for record snow, and $12 million one-off plus $5 million a year for seeding. Sources: Governor's office; Daily Utah Chronicle; KSL 2023; Salt Lake Tribune 2023.
- **Beijing, 8 August 2008.** 1,104 rockets from 21 sites to keep rain off the opening ceremony, which stayed dry; Guinness notes a reported 41 % chance of rain that evening. Sources: Guinness World Records; Irish Times.
- **Lahore, 16 December 2023.** UAE aircraft seeded against smog (at least 48 flares); about 10 % of the city got rain, said the chief minister; US AQI 318 to 189 the next day. Sources: Dawn; Arab News; Aaj News.
- **San Diego, January 1916.** Charles Hatfield's verbal $10,000 contract to fill the Morena reservoir; heavy rain; the Lower Otay Dam failed on 27 January. Death tolls (about 14 to more than 20) and accounts of the court rulings conflict between sources. Sources: Snopes; San Diego County Water Authority; Farmers' Almanac.

**Main case, 2025.** Gangneung, on the coast below Daegwallyeong, had a severe drought in summer 2025. From news reports (secondary sources):

- 20 August: the city starts restricting household water (Segye Ilbo).
- 23 August, morning: the Gangneung Danoje Preservation Society holds a rain rite at Guksaseonghwangsa and the mountain-god shrine on Daegwallyeong. The Obong reservoir is at 18.1 % (News1; Jeonmae).
- 26 August to early September: the Korea Meteorological Administration flies cloud seeding aircraft over Gangneung and the east coast, 10 flights on six days, including 1, 2 and 6 September. It says it flew on days when rain was already falling and that this rain did not come from the seeding; a forecaster expected the effect on the drought to be "extremely minimal" (SBS, 10 September 2025).
- 6–7 September: restrictions are extended; the reservoir is at 12.6 % (Kyunghyang Shinmun).

In ERA5, the cell over the pass then has 91 mm on 13 September, 39 mm on 17 September and 81 mm on 20 September.

**Background, 2006–2010.** Cloud seeding to increase snowfall in the Taebaek Mountains: nine ground-based experiments at Daegwallyeong in January–February 2006 (Lee et al. 2009), and 20 airborne experiments over the range from 2008 to 2010, run by the administration's research institute. The Geoengineering Map lists them under "South Korea Cloud Seeding", with earlier phases at Andong (1995–1996) and in Gyeongnam (2000–2006). "Taebaek Mountains" means the range, not the peak Taebaeksan.

**Why this case:** Daegwallyeong is where the Gangneung Danoje festival begins, with rites to the mountain god (Sansinje) and the guardian deity (Guksaseonghwangje). In 2025 the same shrine received a rain rite while aircraft seeded the clouds nearby. The sketch does not test whether the rite worked. It asks how either side could tell.

**Working question:** when rain follows a rite or a seeding flight, how can anyone tell whether it would have fallen anyway?

## 2. Simulate

**Candidate days.** The exact 2006 experiment days are in the paywalled full text of Lee et al. 2009. Its abstract says the experiments ran on easterly, foggy days with high humidity. `tools/pick_days.py` applies that as a rule to daily ERA5 values for the cell over Daegwallyeong: dominant 10 m wind from 45–135°, daily mean humidity of 80 % or more, and a daily mean temperature of 0 °C or below. In January–February 2006 this picks 18, 19 and 31 January. These are candidate days, not confirmed experiment days. The coarse cell cannot see fog at the pass, which is probably why it finds three days, not nine.

**The map** (`map.js`). The map offers seven days: the three 2006 candidate days, the 2025 rite day and the three named 2025 flight days. On the 2006 days, particles are released at random inside a circle of 3 km around the pass, because the generator site is not public. On the rite day they are released within 0.5 km of the shrine, an interpretive choice that shows where anything let go there would drift. On the flight days the map shows wind only, because the flight paths are not public. Each step is 40 seconds of weather. A particle moves with the 10 m wind, interpolated bilinearly between the 0.25° ERA5 cell centres and linearly between hours, plus a uniform random spread of up to 60 m per axis. It is followed for 3 hours. On all three candidate days, a particle leaving the pass at noon travels 19–28 km west-south-west in 3 hours, towards Yongpyong and Pyeongchang. Particles do not rise, fall, freeze, settle or follow the terrain, and they do not stand for mass. The 60 m spread and the 3 hours are choices, not measurements.

**A first result** (`data/epoch.json`, not yet on the page). The same rule applied to the 52 matching days in the winters 1980–2005, before any seeding at Daegwallyeong, gives a mean of 7.3 cm of ERA5 snowfall on the day itself, against 0.9 cm on an average winter day. Changing the rule (wind 30–150° or 0–180°, humidity 75–85 %) keeps it between about 6 and 8 cm. So the conditions chosen for seeding already pick snowy days. Any effect of seeding has to be found on top of that.

## 3. Situate

**What would have happened anyway** (`tools/case_2025.py`, `case.js`). To credit a rite or a flight with rain, you need to know how often rain comes without it. The script takes every start day from 16 to 30 August in 1940–2024 (1,275 days, no rite) and counts how often ERA5 rain followed. It repeats this for the driest 15 % of those days, by rain in the previous 60 days, as a stand-in for drought.

| After the day | Any late-August day | Driest 15 % | After the 2025 rite |
| --- | --- | --- | --- |
| 1 mm or more within 3 days | 87 % | 84 % | yes |
| a day of 10 mm or more within 7 days | 76 % | 68 % | no |
| a day of 30 mm or more within 21 days | 75 % | 63 % | yes |
| a day of 50 mm or more within 21 days | 53 % | 39 % | yes |

What followed the 2025 rite is ordinary for the season. The window, the thresholds and the drought cut are choices; they change the percentages but not the point. In ERA5 the 60 days before the rite had 283 mm, which is in the driest 17 % but not the driest 15 %: the 25 km cell takes in the mountains and a wet spell on 13–14 August, so it shows the drought less sharply than the Gangneung gauge would.

**Places and institutions to research.** Only the map entry, the news reports and the first papers support these so far.

- **Daegwallyeong:** the site of the 2006 ground experiment and the target area of later flights.
- **Daegwallyeong Sansinje and Guksaseonghwangje:** the rites at the pass that open the Gangneung Danoje festival, and where the 2025 rain rite was held. Older links to rain rites need historical sources.
- **Korea Meteorological Administration and its research institute** (the Meteorological Research Institute, now the National Institute of Meteorological Sciences): they ran the experiments.
- **The cloud physics observation site at Daegwallyeong:** reported by the Korea Times as built in 2003 to measure clouds before and after seeding. This needs a primary source.
- **Weather radar and satellite records** for the seeding days, if they can be found.

## 4. Narrate

The concept: the sky happens once; a cause is not observed, it is assembled from choices. Every claim that an act brought rain is a claim about a day that did not happen. The page works through five questions (`narrate.js`):

1. **What would count as success?** A table of the chain from aircraft to ground (release, supercooled cloud, ice, rain at the ground, more than would have fallen anyway), how each link is measured, what the 2008–2018 Daegwallyeong programme measured (Cha et al. 2019) and what is public for 2025 (almost nothing).
2. **How is the weather measured?** Radar converts reflectivity to rain with Z = a R^b. Sliders show what "+10 dBZ" means under three textbook relations (Marshall–Palmer 200/1.6, NEXRAD 300/1.4, Gunn–Marshall snow 2000/2.0): rain multiplied by about 3 to 5.
3. **Is it a coincidence?** The two-sample formula n = 2 (z_α + z_β)² (cv / e)². From ERA5 (`tools/power.py`): 1,426 rainy days (1 mm or more) between 16 August and 15 September in 1940–2024, mean 14.6 mm, sd 21.8 mm, cv 1.49. A 10 % effect needs about 2,750 seeded and as many unseeded days; 30 % needs 306; 50 % needs 111. Trials run: 9 (2006), 54 (2008–2018), 10 flights (2025). A simulation that draws real ERA5 days found a 10 % effect in 79 % of runs at that size, close to the 80 % aimed for; at 30 % and n = 306 it found it in 71 %, because rain is skewed. A target-and-control design or radar tracking needs fewer days; this is the simplest case.
**Two speculative skies** (`tools/galton.py`, `tools/days.py`, `data/galton.json`, `data/days.json`, `galton.js`). Each drop is a real day from 16 August to 8 September, 1940–2024 (2,040 days), in the ERA5 cell over the pass. The record (blue, behind) lands it at the largest daily rain in the 21 days after it. The speculative sky (ink, in front) rolls those 21 real days again, one day at a time. **If the rite worked** (interpretive, modelled): a dry day (under 1 mm) turns rainy with chance P and takes the rain of a random real rainy day (1 mm or more) from 16 August – 29 September, 1940–2024; a rainy day gets P more. P is a slider, 0–50 %, default 10 %; no rite effect has been measured. **If seeding worked** (modelled): flights on up to six seedable days (rain 0.1 mm or more, mean cloud cover 60 % or more; this page's rule) in the 14 days after the day, one or two hours each (two with chance 0.7, close to 2025's ten flights on six days). Each flight day gains a random amount between 10 % of its rain (KMA, SBS 10 September 2025) and 1 mm per flight hour (NIMS, Dong-A Ilbo 4 September 2025), capped at 8.5 mm (NIMS, best day 2020–2024). The 2025 named flight days (1, 2, 6 September) all meet the seedable rule. Results in one roll, all days: 50 mm within three weeks 50 % in the record, about 58 % with a 10 % rite, about 52 % with seeding; piles overlap about 85 % and 95 %. Days as dry as 2025 (285 mm or less in the 60 days before): 30 %, about 44 % and similar. 2025: the record is 90.9 mm on 13 September; a 10 % rite gives about 100 mm; seeding leaves it at 90.9 mm, because the last flight was on 6 September. Rolls are seeded per day so the slider replays the same roll. The real colour is the one colour on the page, at Audrey's request. The paths between flippers are drawn, not a physical model. Neighbouring days share storms, so the drops are not independent.

**Inside one drop** (`tools/zoom.py`, `data/zoom.json`, `zoom.js`). Both 2025 drops land on the rain of 13 September 2025 (90.9 mm in ERA5; most of it between midnight and 10:00, peak 16.3 mm at 08:00). The zoom replays that day hour by hour as raindrops of 0.1 mm each, filling a gauge drawn after the Joseon rain gauge. One drop in eleven, chosen at random, is hollow: the share a 10 % ask would add (0.1 / 1.1). "As the world sees it" fills the hollow drops in. Drop sizes follow Marshall and Palmer (1948) for each hour's rate, and fall speeds Atlas et al. (1973), D in mm: v = 9.65 − 10.3 e^(−0.6 D) m/s. Hourly rain is reanalysed; sizes, speeds and the hollow drops are modelled.

4. **Seventy-two skies** (`tools/skies.py`, `data/skies.json`). The attribution formula FAR = 1 − P0 / P1 needs P1, the chance of rain with the act, which cannot be observed. So the page leaves it out and asks only whether the rain that followed was unusual, under every combination of four choices: rain of 1, 10, 30 or 50 mm; within 3, 7 or 21 days; compared with any day, drought days (driest 15 % by the previous 60 days) or days as dry as 2025 (within 25 %); years 1940–2024 or 1991–2020. Comparison days are the 15 days around the act's date. Results: after the rite, rain came in 36 of 72 skies, and in none was it unusual (P0 below 20 %; the lowest was 38 %). After the first named flight (1 September), rain came in 36, and was unusual in 2: 50 mm within 21 days compared with drought days (P0 7 % for 1991–2020, 14 % for 1940–2024). The figure is a specification curve: dots sorted by P0, filled where rain followed, with a grid of the choices below.
5. **Where do politics come in?** Why flights are flown (Olympic snow, fine dust, drought, wildfires; 7.3 billion won in 2024; commercial use by 2028), and how credit is claimed in budgets and declined when rain is already falling or a flood follows. Interpretive.

**Also:** the Samguk yusa founding myth (Hwanung with the Earl of Wind, Master of Rain and Master of Clouds on Taebaeksan) and *How to Kill a Cloud* (Tuija Halttunen, 2021).

**Page layout:** the eight-case table and cards are open; the Daegwallyeong map, the baseline table and the methods (success, measurement, chance, politics) are folded in `<details>` so the page stays short. The 72 skies stay open.

## Sources and limits

- **Geoengineering Map, entry "South Korea Cloud Seeding"** (id 5585), ETC Group and Heinrich Böll Foundation: https://map.geoengineeringmonitor.org/wm/south-korea-cloud-seeding. Read on 2026-11-09. Licence: CC BY-NC-ND 4.0, so this sketch links to and summarises the entry rather than copying its data. Type: a secondary record of observed activities, compiled by the map's makers. By its makers' own account the map is partial.
- **Lee et al. 2009**, "Preliminary results of the ground-based orographic snow enhancement experiment for the easterly cold fog (cloud) at Daegwallyeong during the 2006 winter", *Advances in Atmospheric Sciences* 26: 222. Abstract: https://ui.adsabs.harvard.edu/abs/2009AdAtS..26..222L/abstract. Found 2026-11-09; only the abstract has been read. Type: a scientific report of observed experiments.
- **"Current state of cloud seeding in Korea"**, conference abstract, American Meteorological Society 91st Annual Meeting, 2011: https://ams.confex.com/ams/91Annual/webprogram/Paper188294.html. Reports 20 airborne experiments, mostly over the Taebaek range. Found 2026-11-09; not yet read in full.
- A longer list of Korean and English sources to read is in NOTES.md.
- **Sources cited by the map entry, not yet read:** the WMO Register of National Weather Modification Projects for 1996 and for 2001–2002, and the WMO weather modification register (https://community.wmo.int/en/wx-mod-register). These should be read for dates, sites and results.
- **News reports on the 2025 drought** (secondary sources, read 2026-11-16): Segye Ilbo, 23 Aug 2025, https://www.segye.com/newsView/20250823504737; News1, 23 Aug 2025, https://www.news1.kr/amp/local/kangwon/5887906 and 25 Aug 2025, https://www.news1.kr/amp/local/kangwon/5889565; Jeonmae, https://www.jeonmae.co.kr/news/articleView.html?idxno=1178002; SBS, 10 Sep 2025, https://news.sbs.co.kr/news/endPage.do?news_id=N1008251619; Kyunghyang Shinmun, 7 Sep 2025, https://www.khan.co.kr/article/202509071704001. Dates and quotes are taken from these; the exact time of the rite and three of the six flight days are not given.
- **Success claims and context:** Cha J.-W. et al. 2019, Atmosphere 29(4): 481–499, doi:10.14191/Atmos.2019.29.4.481, https://j-komes.or.kr/_PR/view/?aidx=21863&bidx=1770; Ministry of Culture, Sports and Tourism, 27 May 2024, https://www.mcst.go.kr/english/policy/kocis/newsView.jsp?pSeq=228; Korea Times, 4 Jun 2017, https://www.koreatimes.co.kr/business/tech-science/20170604/korea-looks-to-cloud-seeding-in-war-on-fine-dust; Hankook Ilbo, 25 Feb 2016, https://www.hankookilbo.com/news/article/201602251868147363. Read 2026-11-16. The sources disagree on when the Daegwallyeong cloud physics station was built (2003 or 2006).
- **Radar relations and raindrops** (textbook, modelled): Marshall and Palmer 1948, J. Meteor. 5: 165–166; Atlas, Srivastava and Sekhon 1973, Rev. Geophys. 11: 1–35 (fall speeds); Fulton et al. 1998, Weather and Forecasting 13: 377–395; Gunn and Marshall 1958, J. Meteor. 15: 452–461.
- **Elsewhere and earlier** (secondary): Samguk yusa, Gojoseon chapter; Snopes, https://www.snopes.com/san-diego-rainmaker/ and San Diego County Water Authority, https://sdcwa.org/quench-a-thirst-flipbook/files/assets/basic-html/page31.html, on Hatfield; CNBC, 17 Apr 2024, https://www.cnbc.com/2024/04/17/uae-denies-cloud-seeding-took-place-before-severe-dubai-floods.html; Down to Earth on World Weather Attribution, https://www.downtoearth.org.in/climate-change/why-did-dubai-flood-world-weather-attribution-says-global-warming-not-cloud-seeding-the-reason-95831; Bloomberg 2025, https://prod.cm.bloomberg.com/features/2025-dubai-storm-floods-cloud-seeding-geoengineering; Cineuropa review of How to Kill a Cloud, https://cineuropa.org/en/newsdetail/402077/.
- **ERA5 reanalysis** (Hersbach et al. 2020; Copernicus Climate Change Service), through the Open-Meteo Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api. Fetched 2026-11-16. Licence CC BY 4.0. Type: reanalysed. Daily values for the 0.25° cell centred 37.75 N, 128.75 E for January–February 1980–2010 (`data/winters.json`), daily precipitation for 1940–2025 summarised in `data/case-2025.json`, and hourly 10 m wind on a 5 × 5 block of cells for the seven map days (`data/wind.json`). Changes: kept January and February only; derived candidate days, snow profiles and winter totals (`tools/pick_days.py`).
- **Terrain:** Copernicus DEM GLO-90 (© DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA), through the Open-Meteo Elevation API, sampled on a 0.01° grid. Fetched 2026-11-16. Type: cartographic.
- **Places:** © OpenStreetMap contributors (ODbL), looked up 2026-11-16, and the NOAA GHCN-Daily station list for the Gangneung station (KSM00047105). Each point's origin is in `data/places.json`.
- **Not used:** the Daegwallyeong station record from the Korea Meteorological Administration needs a login, and NOAA GHCN-Daily has no Daegwallyeong station and gaps at Gangneung in 2006. So there are no observations on the page yet.
- **Realtime Weather starter template**, Realtime Urbanism Lab, `sketches/_template/index.html` at repository revision `613d7f6` (copied 2026-11-02): https://github.com/RealtimeUrbanismLab/weather-commons/tree/613d7f6/sketches/_template. Code: MIT. Original text: CC BY 4.0. Type: synthetic and illustrative. Its synthetic wind animation was replaced on 2026-11-16 by the map.
- **Ritual and historical sources:** none yet. When they are added, they will be labelled interpretive or historical, and kept apart from measured data.

The model calculates where particles carried by the reanalysed 10 m wind would be, hour by hour, and how often rain follows a late-August day in ERA5. It cannot establish where silver iodide went, how much rain or snow fell at the pass or in Gangneung, whether the seeding worked, whether the rites did anything, or any harm to people or ecosystems. ERA5 averages over about 25 km, so it misses the way air is forced up and around the pass, which is what the experiments relied on.
