"""Daily rain and cloud for every 1 August - 30 September, 1940-2025, for the speculative skies.

The two speculative machines re-roll the three weeks after each day, one day at a time, so they
need each day's rain, not only the largest day. Seeding is only possible on days with cloud and
rain already falling, so the cloud cover is kept too.

ERA5 via Open-Meteo, CC BY 4.0, cell centred 37.75 N 128.75 E. Reanalysed.
Writes data/days.json. Run from the sketch folder:  python3 tools/days.py
"""

import datetime as dt
import json
import time

from fetch_weather import CELL, DATA, get


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1940-08-01", "end_date": "2025-09-30",
        "daily": "precipitation_sum,cloud_cover_mean",
        "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    years = {}
    for t, p, c in zip(d["time"], d["precipitation_sum"], d["cloud_cover_mean"]):
        day = dt.date.fromisoformat(t)
        if day.month not in (8, 9):
            continue
        y = years.setdefault(str(day.year), {"rain": [], "cloud": []})
        y["rain"].append(round(p or 0, 1))
        y["cloud"].append(round(c) if c is not None else None)
    out = {
        "about": "Daily ERA5 precipitation (mm) and mean cloud cover (%) for 1 August - 30 September of each year, "
                 "1940-2025, index 0 = 1 August, in the cell centred 37.75 N 128.75 E, via Open-Meteo, CC BY 4.0. Reanalysed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "years": years,
    }
    (DATA / "days.json").write_text(json.dumps(out, separators=(",", ":")))
    n = sum(len(v["rain"]) for v in years.values())
    print(f"{len(years)} years, {n} days; 2025 from 23 Aug: {years['2025']['rain'][22:45]}")


if __name__ == "__main__":
    main()
