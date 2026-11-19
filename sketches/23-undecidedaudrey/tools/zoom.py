"""Hourly rain for the day both 2025 drops landed on: 13 September 2025.

The Galton sky lands the 2025 rite and flight at the largest daily rain in the next three weeks,
which in both cases is 13 September 2025. The zoom replays that day hour by hour as raindrops.

ERA5 hourly precipitation for the cell over Daegwallyeong, via Open-Meteo, CC BY 4.0. Reanalysed.
Writes data/zoom.json. Run from the sketch folder:  python3 tools/zoom.py
"""

import json
import time

from fetch_weather import CELL, DATA, get

DAY = "2025-09-13"


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": DAY, "end_date": DAY,
        "hourly": "precipitation", "daily": "precipitation_sum",
        "timezone": "Asia/Seoul", "models": "era5",
    })
    hourly = [round(p or 0, 2) for p in d["hourly"]["precipitation"]]
    out = {
        "about": f"ERA5 hourly precipitation (mm) for {DAY}, Korea Standard Time, in the cell centred 37.75 N "
                 "128.75 E, via Open-Meteo, CC BY 4.0. Reanalysed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "date": DAY,
        "hourly_mm": hourly,
        "daily_mm": d["daily"]["precipitation_sum"][0],
    }
    (DATA / "zoom.json").write_text(json.dumps(out, indent=1))
    print(f"{DAY}: {out['daily_mm']} mm in the day, {round(sum(hourly), 1)} mm summed from hours; peak "
          f"{max(hourly)} mm at {hourly.index(max(hourly)):02d}:00")


if __name__ == "__main__":
    main()
