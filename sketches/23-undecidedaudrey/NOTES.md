# Notes

Working notes for sketch 23. Read this first.

## Next

- Galton sky for the other cases: same engine, each case's own days, outcome and shadow direction (rain-stopping asks put the shadow on the wetter side). Dubai, Beijing and Mandalika first; San Diego needs a pre-1940 record; Lahore's smog needs air-quality data.
- Seven short cases are summarised, not computed. Later: a small 72-skies strip for the cases ERA5 can reach (Dubai, Mandalika hourly, Bhopal, Beijing), with each case's own definition of the outcome.
- Unresolved in the cases: Hatfield's death toll and court rulings (sources conflict); rain in Utah on 4–6 June 2021 (only an opinion column); Dubai flights on 15 April (Bloomberg vs the National Center of Meteorology).
- When the Gangneung station record arrives, add "data source" as a fifth axis of the 72 skies (ERA5 or station), making 144.
- The Blind Sky (designed 2026-11-16, not built): a listening experiment with a staircase threshold, catch trials, random labels "rite" or "aircraft", and a printable verdict. Build after the 72 skies settle.
- Ask Audrey who "Alex Bomslay" is (mentioned with the Dubai 2024 flood); no source found under that name.
- More folktales and older rites: 석척기우 (lizard rain rite), dragon rain rites, the green-frog tale; each needs a source before it goes on the page.
- Check the Fulton et al. 1998 and Gunn–Marshall 1958 Z–R values against the papers.
- Narrate scenes for the 2025 case, to choose from (proposed 2026-11-16):
  - "The rain called the planes": flight days on the rain chart, rain on flight days against other days; selection bias made visible, maybe the map played backwards.
  - "One sheet of paper": the possible seeding share on 1 September (about 10 % of 1.2 mm, about 0.1 mm, from SBS) beside the thickness of one sheet of paper, the paper burned at rites (soji).
  - "One cell in 3,800": that 0.12 mm against the rain deficit by 20 August (861.1 − 403.4 mm, Segye Ilbo).
  - Two texts: the rite's prayer (chungmun) beside the KMA explanation. Needs the 2025 prayer text.
  - A ledger of who claimed what about the rain: preservation society, KMA, SBS headline, ERA5.
- Observed rain: KMA station records for Gangneung (105) and Daegwallyeong (100), August–September 2025. NOAA GHCN-Daily has no 2025 rain for Gangneung. Needs Audrey's download from the KMA data portal.
- Ask the Gangneung Danoje Preservation Society or find reports on what was said at the 2025 rite, and whether they made any claim about the rain afterwards.
- The six 2025 flight days: only 1, 2 and 6 September are named. Find the others.
- 2006 background: full text of Lee et al. 2009 for the experiment days and generator site; the 2006 snow profile (`data/epoch.json`) could become a second chart.
- Peer check before publishing: is it clear, what is missing, does it claim too much?

## Decisions

- 2026-11-02: the participant confirmed sketch number 23 and the public author name Audrey Doh.
- 2026-11-02: use `undecidedaudrey` as the working title while the topic is undecided.
- 2026-11-02: retain the shared black-and-white template and label all starter motion as synthetic.
- 2026-11-02: publish the first version to AudreyDOh/weather-commons. Submission to the shared repository is a later step.
- 2026-11-09: the case is the Taebaek Mountains snow-enhancement cloud seeding (2006, 2008–2010), from the Geoengineering Map entry "South Korea Cloud Seeding". It is chosen because it overlaps with mountain rites at the same place, which suits Audrey's practice of reading Korean folk belief through science.
- 2026-11-09: the sketch compares how seeding and ritual each judge whether the sky answered. It does not claim that rituals work or fail. Ritual material is labelled interpretive.
- 2026-11-09: corrected the place. The map's "Taebaek Mountains" is the range, and the 2006 experiment was at Daegwallyeong, not Taebaeksan. The ritual pairing moves from Cheonjedan on Taebaeksan to the rites at Daegwallyeong that open Gangneung Danoje.
- 2026-11-16: the main case moves to the 2025 drought: the rain rite at the shrine on 23 August and the KMA seeding flights from 26 August. 2006–2010 becomes background. Reason: dated, public sources for both asks, at the same pass, in the same weeks.
- 2026-11-16: on the rite day the map releases particles at the shrine (interpretive); on flight days it shows wind only, because flight paths are not public.
- 2026-11-16: baseline = start days 16–30 August, 1940–2024, ERA5; drought = driest 15 % by the previous 60 days of rain. These are choices; say so on the page.
- 2026-11-16: replaced the FAR slider (an invented P1) with the 72 skies: a multiverse of definitions, asking only whether the rain was unusual. The station axis is replaced for now by the reference period (1940–2024 or 1991–2020).
- 2026-11-16: the page presents eight cases in the same four parts (ask, what followed, who claimed what, what cannot be known), with Daegwallyeong at length. Title kept. Detail is folded so the page stays simple.
- 2026-11-16: the Galton sky uses one board of real days only (no simulated second board). The only modelled mark is the faint 10 % shadow of the 2025 drop. The same 10 % is used for every case so they compare fairly.
- 2026-11-16: page title "Two asks at Daegwallyeong"; the folder stays `23-undecidedaudrey`. Page in English, with Korean names for places.
- 2026-11-16: the exact experiment days are paywalled, so the sketch uses candidate days chosen by a rule from the paper's abstract, labelled as candidates (18, 19 and 31 January 2006).
- 2026-11-16: use ERA5 through Open-Meteo for wind and snow. ERA5-Land returned no values here, KMA station data needs a login, and NOAA GHCN-Daily has no Daegwallyeong station. ERA5's 25 km cell is shown on the map as a limit, not hidden.
- 2026-11-16: draw the coast from the terrain (height 0) instead of Natural Earth, which is too coarse at this scale.
- 2026-11-16: the Joseon rain-rite chart is a later extra, not part of this version.
- 2026-11-09: the map data is CC BY-NC-ND 4.0, so the sketch links to and summarises the entry rather than copying its data.

## Questions

- Sources disagree on how many airborne experiments there were after 2008 (20, 23, 36, 54), because they count different periods. Which count covers 2008–2010 exactly?
- Where exactly were the ground burners at Daegwallyeong, and how far are they from the shrine sites of the rites?
- Were results published, and how did they handle attribution, that is, snow that would have fallen anyway?
- Are the Daegwallyeong rites historically linked to weather, or mainly to protection and harvest?
- Remote sensing: can radar or satellite images for the seeding days be found, and can they be shown?
- The candidate-day rule finds 3 days in 2006, not 9. Is that the coarse cell missing fog at the pass, or were some experiments on days with other winds?
- How large an effect did the Korean reports claim for 2006–2008 (one summary says about 3 %)? This needs the primary source before it goes on the page.

## Reading list

Found by web search on 2026-11-09. Not yet read; check each against the original.

Korean:
- 항공기를 이용한 인공증우(설) 기술과 결과분석, 『대기』 2019: https://j-komes.or.kr/_PR/view/?aidx=21863&bidx=1770
- 응용기상기술개발연구: 기상조절 기술개발 (보고서): https://scienceon.kisti.re.kr/srch/selectPORSrchReport.do?cn=TRKO201500009625
- 국립기상과학원 조직 및 업무 (연혁): http://www.nims.go.kr/?sub_num=824
- 인공강우로 대관령에 내린 눈 아시나요? (정책브리핑, year not given): https://www.korea.kr/news/policyNewsView.do?newsId=148658627
- 기상청의 인공강설 실험 (서울신문 2012): https://www.seoul.co.kr/news/society/science-news/2012/03/12/20120312500015
- “펑 펑” 폭음 한시간 후… 마술처럼 눈이 펑펑 (한국일보 2016): https://www.hankookilbo.com/news/article/201602251868147363
- 인공강우 기술의 발전과 기후변화 대응을 위한 활용방안 (기상청 2024): https://www.kma.go.kr/down/t_policy/t_policy_202412.pdf
- 인공강우기술 어디까지 왔나? (에코미디어): https://www.ecomedia.co.kr/news/newsview.php?ncode=1065594746655784
- 인공증우(설) 항공실험 분석: 2019년 국제공동연구 (한국방재학회지): https://www.j-kosham.or.kr/journal/view.php?number=10055&viewtype=pubreader
- 항공 구름관측 레이더를 활용한 인공강우 실험효과 분석: https://journal.kenss.or.kr/_common/do.php?a=current&b=11&bidx=4332&aidx=48138

English:
- Lee et al. 2009, Daegwallyeong 2006 ground experiment: https://ui.adsabs.harvard.edu/abs/2009AdAtS..26..222L/abstract
- Current state of cloud seeding in Korea (AMS 2011): https://ams.confex.com/ams/91Annual/webprogram/Paper188294.html
- Yang et al. 2018, ground-based seeding over Pyeongchang: https://onlinelibrary.wiley.com/doi/10.1155/2018/9465923
- Seedable clouds on the Korean Peninsula (Remote Sensing 2020): https://www.mdpi.com/2072-4292/12/9/1487
- WRF simulations of airborne seeding, Pyeongchang 2016: https://www.researchgate.net/publication/323424357
- Cloud seeding by UAV and research aircraft in Korea: https://www.researchgate.net/publication/361473892
- Recent activities of cloud seeding of NIMS/KMA (2024 slides): https://awmc.royalrain.go.th/awmc2024/img/KOREA_Recent%20activities%20of%20cloud%20seeding%20of%20NIMSKMA.pdf
- Airborne seeding ensemble modelling, Yeongdong (2025): https://doi.org/10.1007/s13143-025-00395-7
- Korea looks to cloud seeding in war on fine dust (Korea Times 2017): https://www.koreatimes.co.kr/business/tech-science/20170604/korea-looks-to-cloud-seeding-in-war-on-fine-dust
- Precipitation formation from orographic cloud seeding (PNAS 2018, Idaho, for comparison): https://www.pnas.org/doi/full/10.1073/pnas.1716995115

## Done

- 2026-11-02: created the sketch using scripts/new-sketch.mjs.
- 2026-11-02: added the author, working title, provisional question, research status, and sources and limits.
- 2026-11-02: passed check-sketches and check-sizes; verified the page and synthetic animation in a browser preview.
- 2026-11-09: chose the case and wrote the working question, places to research and first source into the README and page.
- 2026-11-09: moved the case and ritual pairing to Daegwallyeong, added the first experiment papers and a reading list.
- 2026-11-16: read the Lee et al. 2009 abstract (nine ground experiments, AgI at 1.04 g/min, easterly fog, high humidity at Gangneung).
- 2026-11-16: added data scripts (`tools/fetch_weather.py`, `tools/pick_days.py`, `tools/fetch_map.py`) and small data files in `data/` (about 190 KB).
- 2026-11-16: replaced the template animation with the Daegwallyeong map: terrain, ERA5 grid, places, the shrine as an interpretive layer, hourly wind and modelled particles for three candidate days. Checked in a browser preview; particles leaving the pass at noon go 19–28 km west-south-west in 3 hours.
- 2026-11-16: first result: matching days in 1980–2005 average 7.3 cm of ERA5 snowfall against 0.9 cm on an average winter day.
- 2026-11-16: added the 2025 case: `tools/case_2025.py`, `data/case-2025.json`, `case.js`, events list, rain chart and baseline table; the map now has the rite day and three flight days (`data/wind.json` replaces `wind-2006.json`).
- 2026-11-16: added the Narrate section: evidence-chain table, Z–R sliders, the sample-size formula with ERA5 cv (`tools/power.py`, `data/power.json`), FAR icon field, politics, and Dubai, Hatfield, the founding myth and How to Kill a Cloud.
- 2026-11-16: added the 72 skies (`tools/skies.py`, `data/skies.json`, specification curve in `narrate.js`) and the concept line "The sky happens once. A cause is not observed; it is assembled from choices."
- 2026-11-16: added the eight-case table and seven short case cards from news and secondary sources; folded the map, baseline and methods.
- 2026-11-16: added the Galton sky for Daegwallyeong (`tools/galton.py`, `data/galton.json`, `galton.js`), placed before the 72 skies.
- 2026-11-18: added the zoom into 13 September 2025 (`tools/zoom.py`, `data/zoom.json`, `zoom.js`): hourly ERA5 rain as raindrops, a gauge, one drop in eleven hollow as a 10 % share, and a world-view switch.
- 2026-11-18: slowed the Galton sky so it reads calmer: drops fall about three times slower, one day every three frames (about 20 a second, under two minutes for all 2,040; "Fill the board" skips ahead), flippers turn gently.
