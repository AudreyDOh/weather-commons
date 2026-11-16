"""The 2025 Gangneung drought: a rain rite and cloud seeding flights in the same weeks.

Writes data/case-2025.json:
  events    what happened and when, each with its news source (secondary, not observed)
  rain      daily ERA5 precipitation for the cell over Daegwallyeong, 1 Aug - 30 Sep 2025
  baseline  how often rain follows a late-August day in 1940-2024, with no rite, for all
            days and for the driest 15 % of days, against what followed the 2025 rite

ERA5 comes from the Open-Meteo Historical Weather API (CC BY 4.0). It is reanalysed, and its
0.25 degree cell (about 25 km) is not the rain over Gangneung or its reservoir.

Run from the sketch folder:  python3 tools/case_2025.py
Needs Python 3 and curl.
"""

import datetime as dt
import json
import pathlib
import time

from fetch_weather import CELL, DATA, get

RITE = dt.date(2025, 8, 23)

EVENTS = [
    {"date": "2025-08-20", "kind": "restriction",
     "text": "Gangneung starts restricting household water supply.",
     "source": "Segye Ilbo, 23 Aug 2025", "url": "https://www.segye.com/newsView/20250823504737"},
    {"date": "2025-08-23", "kind": "rite",
     "text": "The Gangneung Danoje Preservation Society holds a rain rite at Guksaseonghwangsa and the "
             "mountain-god shrine, Daegwallyeong, in the morning. The main reservoir, Obong, is at 18.1 %.",
     "source": "News1, 23 Aug 2025; Jeonmae, Aug 2025",
     "url": "https://www.news1.kr/amp/local/kangwon/5887906"},
    {"date": "2025-08-26", "date_end": "2025-09-06", "kind": "flights",
     "text": "The Korea Meteorological Administration flies cloud seeding aircraft over Gangneung and the "
             "east coast: 10 flights on six days between 26 August and early September, including 1, 2 and "
             "6 September. It says it flew on days when rain was already falling, and that the rain did "
             "not come from the seeding.",
     "source": "SBS, 10 Sep 2025", "url": "https://news.sbs.co.kr/news/endPage.do?news_id=N1008251619"},
    {"date": "2025-09-06", "kind": "restriction",
     "text": "Restrictions are extended to 123 apartment complexes and 10 large hotels. On 7 September "
             "the reservoir is at 12.6 %.",
     "source": "Kyunghyang Shinmun, 7 Sep 2025", "url": "https://www.khan.co.kr/article/202509071704001"},
]
FLIGHT_DAYS = ["2025-09-01", "2025-09-02", "2025-09-06"]  # the flight days the SBS report names

# What could count as "the rite worked": rain after it, within some days.
OUTCOMES = [
    {"id": "d3_1", "text": "1 mm or more within 3 days", "days": 3, "mm": 1},
    {"id": "d7_10", "text": "a day of 10 mm or more within 7 days", "days": 7, "mm": 10},
    {"id": "d21_30", "text": "a day of 30 mm or more within 21 days", "days": 21, "mm": 30},
    {"id": "d21_50", "text": "a day of 50 mm or more within 21 days", "days": 21, "mm": 50},
]
WINDOW = (16, 30)  # late August: start days 16-30 August
DRY_SHARE = 0.15   # "drought": the driest 15 % of those days by the previous 60 days of rain
DRY_DAYS = 60


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1940-01-01", "end_date": "2025-10-31",
        "daily": "precipitation_sum", "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    rain = {dt.date.fromisoformat(t): p for t, p in zip(d["time"], d["precipitation_sum"])}

    def after(day, n):
        return [rain.get(day + dt.timedelta(k)) or 0 for k in range(1, n + 1)]

    def before(day):
        return sum(rain.get(day - dt.timedelta(k)) or 0 for k in range(DRY_DAYS))

    def hit(day, o):
        return any(x >= o["mm"] for x in after(day, o["days"]))

    starts = [dt.date(y, 8, k) for y in range(1940, 2025) for k in range(WINDOW[0], WINDOW[1] + 1)]
    totals = sorted(before(s) for s in starts)
    cut = totals[int(DRY_SHARE * len(totals))]
    dry = [s for s in starts if before(s) <= cut]
    pct = lambda xs: round(100 * sum(xs) / len(xs))

    baseline = {
        "about": f"Start days {WINDOW[0]}-{WINDOW[1]} August, 1940-2024 ({len(starts)} days, no rite). "
                 f"'Driest' means the {round(DRY_SHARE * 100)} % of them with the least rain in the previous "
                 f"{DRY_DAYS} days ({len(dry)} days, {round(cut)} mm or less). ERA5, reanalysed.",
        "rite_prior_mm": round(before(RITE)),
        "dry_cut_mm": round(cut),
        "rite_prior_rank": round(100 * sum(t <= before(RITE) for t in totals) / len(totals)),
        "outcomes": [
            {**o,
             "all": pct([hit(s, o) for s in starts]),
             "dry": pct([hit(s, o) for s in dry]),
             "after_rite_2025": hit(RITE, o)}
            for o in OUTCOMES
        ],
    }

    first = dt.date(2025, 8, 1)
    series = [{"date": str(first + dt.timedelta(k)), "mm": rain.get(first + dt.timedelta(k))} for k in range(61)]

    (DATA / "case-2025.json").write_text(json.dumps({
        "about": "The 2025 Gangneung drought. Events are from news reports (secondary sources). Rain is ERA5 "
                 "daily precipitation for the cell centred 37.75 N 128.75 E, via Open-Meteo, CC BY 4.0: "
                 "reanalysed, not observed, and not the rain at Gangneung or its reservoir.",
        "fetched": time.strftime("%Y-%m-%d"),
        "rite": str(RITE),
        "flight_days": FLIGHT_DAYS,
        "events": EVENTS,
        "rain": series,
        "baseline": baseline,
    }, indent=1))
    print("case-2025.json written")
    for o in baseline["outcomes"]:
        print(f"  {o['text']}: all {o['all']} %, driest {o['dry']} %, after the 2025 rite: {o['after_rite_2025']}")
    print("  rain in the 60 days before the rite:", baseline["rite_prior_mm"], "mm, percentile",
          baseline["rite_prior_rank"])


if __name__ == "__main__":
    main()
