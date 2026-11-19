"""Seventy-two skies: a multiverse analysis of the 2025 rain.

Instead of inventing the chance of rain *with* the rite or the flights (which nobody can observe),
ask only: was the rain that followed them unusual? Answer it 72 times, once for every combination
of four reasonable choices:

  rain     a day of at least 1, 10, 30 or 50 mm
  wait     within 3, 7 or 21 days
  compare  any day near that date / drought days (driest 15 % by the previous 60 days of rain) /
           days as dry as 2025 (previous 60 days within 25 % of 2025's total)
  period   1940-2024 / 1991-2020 (the current climate normal)

For each "sky", P0 is the share of comparison days that the outcome followed, and the page shows
whether it followed the 2025 act. Comparison days are the 15 days centred on the act's date, in
every year of the period. Acts: the rain rite (23 Aug 2025) and the first named seeding flight
(1 Sep 2025).

ERA5 daily precipitation for the cell over Daegwallyeong, via Open-Meteo (CC BY 4.0). Reanalysed.
Writes data/skies.json. Run from the sketch folder:  python3 tools/skies.py
"""

import datetime as dt
import itertools
import json
import time

from fetch_weather import CELL, DATA, get

RAIN = [1, 10, 30, 50]
WAIT = [3, 7, 21]
COMPARE = ["any", "drought", "like2025"]
PERIOD = [(1940, 2024), (1991, 2020)]
ACTS = [{"id": "rite", "label": "the rain rite", "date": dt.date(2025, 8, 23)},
        {"id": "flight", "label": "the first named seeding flight", "date": dt.date(2025, 9, 1)}]
HALF = 7          # comparison days: the act's day of year +/- 7 days
PRIOR = 60        # days of rain that define how dry it had been
DRY_SHARE = 0.15
LIKE = 0.25       # "as dry as 2025": previous rain within 25 % of 2025's


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1940-01-01", "end_date": "2025-10-31",
        "daily": "precipitation_sum", "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    rain = {dt.date.fromisoformat(t): (p or 0) for t, p in zip(d["time"], d["precipitation_sum"])}

    def prior(day):
        return sum(rain.get(day - dt.timedelta(k), 0) for k in range(PRIOR))

    def followed(day, mm, wait):
        return any(rain.get(day + dt.timedelta(k), 0) >= mm for k in range(1, wait + 1))

    skies = []
    for act in ACTS:
        a = act["date"]
        act_prior = prior(a)
        for (y0, y1) in PERIOD:
            days = [dt.date(y, a.month, a.day) + dt.timedelta(k)
                    for y in range(y0, y1 + 1) for k in range(-HALF, HALF + 1)]
            totals = sorted(prior(s) for s in days)
            cut = totals[int(DRY_SHARE * len(totals))]
            groups = {
                "any": days,
                "drought": [s for s in days if prior(s) <= cut],
                "like2025": [s for s in days if abs(prior(s) - act_prior) <= LIKE * act_prior],
            }
            for mm, wait, comp in itertools.product(RAIN, WAIT, COMPARE):
                g = groups[comp]
                p0 = sum(followed(s, mm, wait) for s in g) / len(g)
                skies.append({"act": act["id"], "rain": mm, "wait": wait, "compare": comp,
                              "period": f"{y0}-{y1}", "n": len(g), "p0": round(p0, 3),
                              "happened": followed(a, mm, wait)})

    out = {
        "about": "Seventy-two definitions of 'rain after the act', each with P0 = how often that rain follows "
                 "comparable days anyway, and whether it followed the 2025 act. ERA5 daily precipitation for the "
                 "0.25 degree cell over Daegwallyeong via Open-Meteo, CC BY 4.0. Reanalysed rain; the choices are "
                 "modelled.",
        "fetched": time.strftime("%Y-%m-%d"),
        "axes": {"rain": RAIN, "wait": WAIT, "compare": COMPARE, "period": [f"{a}-{b}" for a, b in PERIOD]},
        "acts": [{**a, "date": str(a["date"]), "prior_mm": round(prior(a["date"]))} for a in ACTS],
        "skies": skies,
    }
    (DATA / "skies.json").write_text(json.dumps(out, separators=(",", ":")))
    for act in ACTS:
        s = [k for k in skies if k["act"] == act["id"]]
        hap = [k for k in s if k["happened"]]
        rare = [k for k in hap if k["p0"] < 0.2]
        p0s = sorted(k["p0"] for k in s)
        print(f"{act['label']}: {len(s)} skies, P0 from {p0s[0]:.2f} to {p0s[-1]:.2f}; "
              f"followed in {len(hap)}; unusual (P0 < 0.2) in {len(rare)}")


if __name__ == "__main__":
    main()
