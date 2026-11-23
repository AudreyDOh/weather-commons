"""Drops for the Galton sky.

Each drop is a real day: every day from 16 August to 8 September, 1940-2024, in the ERA5 cell
over Daegwallyeong. For each day:
  mm    the largest daily rain in the 21 days after it (where the drop lands)
  wdir  the day's dominant 10 m wind direction, degrees it blows from (how the flippers turn)
  wspd  the day's maximum 10 m wind speed, km/h
  prior the rain in the 60 days before it, mm (how dry it already was; 2025 had 283 mm before the rite)

Plus the two 2025 acts, the rain rite (23 August) and the first named seeding flight (1 September),
with the same values. ERA5 via Open-Meteo, CC BY 4.0. Reanalysed.

Writes data/galton.json. Run from the sketch folder:  python3 tools/galton.py
"""

import datetime as dt
import json
import time

from fetch_weather import CELL, DATA, get

WINDOW = ((8, 16), (9, 8))
WAIT = 21
ACTS = [{"id": "rite", "label": "rain rite", "date": dt.date(2025, 8, 23)},
        {"id": "flight", "label": "first named seeding flight", "date": dt.date(2025, 9, 1)}]


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1940-01-01", "end_date": "2025-10-31",
        "daily": "precipitation_sum,wind_direction_10m_dominant,wind_speed_10m_max",
        "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    days = {dt.date.fromisoformat(t): (p or 0, wd, ws) for t, p, wd, ws in zip(
        d["time"], d["precipitation_sum"], d["wind_direction_10m_dominant"], d["wind_speed_10m_max"])}

    def drop(day):
        mm = max(days[day + dt.timedelta(k)][0] for k in range(1, WAIT + 1))
        _, wd, ws = days[day]
        prior = sum(days[day - dt.timedelta(k)][0] for k in range(1, 61))
        return {"date": str(day), "mm": round(mm, 1), "wdir": wd, "wspd": ws, "prior": round(prior)}

    (m0, d0), (m1, d1) = WINDOW
    drops = []
    for y in range(1940, 2025):
        day = dt.date(y, m0, d0)
        while day <= dt.date(y, m1, d1):
            drops.append(drop(day))
            day += dt.timedelta(1)

    out = {
        "about": f"Each drop is a real day, 16 Aug - 8 Sep, 1940-2024: the largest daily rain (mm) in the {WAIT} days "
                 "after it, and that day's dominant 10 m wind (direction it blows from, max speed km/h), and the rain in the 60 days before it (prior, mm). ERA5 cell "
                 "centred 37.75 N 128.75 E via Open-Meteo, CC BY 4.0. Reanalysed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "wait_days": WAIT,
        "drops": drops,
        "acts": [{**a, "date": str(a["date"]), **{k: v for k, v in drop(a["date"]).items() if k != "date"}} for a in ACTS],
    }
    (DATA / "galton.json").write_text(json.dumps(out, separators=(",", ":")))
    mms = sorted(x["mm"] for x in drops)
    q = lambda f: mms[int(f * (len(mms) - 1))]
    print(f"{len(drops)} drops; quartiles {q(.25)}, {q(.5)}, {q(.75)} mm")
    cut = sorted(x["prior"] for x in drops)[int(0.15 * len(drops))]
    dry = [x for x in drops if x["prior"] <= cut]
    print(f"  driest 15 %: prior <= {cut} mm, {len(dry)} days; 50 mm+ within {WAIT} days: "
          f"all {sum(x['mm'] >= 50 for x in drops) / len(drops):.0%}, dry {sum(x['mm'] >= 50 for x in dry) / len(dry):.0%}")
    for a in out["acts"]:
        above = sum(x["mm"] >= a["mm"] for x in drops) / len(drops)
        print(f"  {a['label']}: {a['mm']} mm; days with at least as much: {above:.0%}; shadow at 10 %: {a['mm'] / 1.1:.1f} mm")


if __name__ == "__main__":
    main()
