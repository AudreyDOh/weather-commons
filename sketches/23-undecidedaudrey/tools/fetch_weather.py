"""Fetch the small reanalysis files the page reads.

Source: Open-Meteo Historical Weather API (https://open-meteo.com/en/docs/historical-weather-api),
which serves ECMWF ERA5 reanalysis at 0.25 degrees (about 25 km). Licence: CC BY 4.0, cite
Open-Meteo and Copernicus ERA5. Values are reanalysed, not observed.

Writes, in data/:
  winters.json  daily ERA5 values for the grid cell over Daegwallyeong, every January and
                February from 1980 to 2010
  wind.json     hourly 10 m wind on a 5 x 5 grid of ERA5 cells around Daegwallyeong, for the
                2006 candidate days (pick_days.py) and the 2025 rite and flight days (case_2025.py)

Run from the sketch folder:  python3 tools/fetch_weather.py
Run it once before pick_days.py and case_2025.py, and again after them for the wind.
Needs Python 3 and curl.
"""

import json
import pathlib
import subprocess
import time
import urllib.parse

API = "https://archive-api.open-meteo.com/v1/archive"
HERE = pathlib.Path(__file__).resolve().parent.parent
DATA = HERE / "data"

# The ERA5 cell that contains Daegwallyeong and Gangneung (centre 37.75 N, 128.75 E).
CELL = (37.75, 128.75)
# A 5 x 5 block of ERA5 cell centres around it, for the wind field.
GRID_LATS = [37.25, 37.5, 37.75, 38.0, 38.25]
GRID_LONS = [128.25, 128.5, 128.75, 129.0, 129.25]


def get(params):
    # curl uses the system certificates, which some Python installs on macOS lack.
    url = API + "?" + urllib.parse.urlencode(params, safe=",")
    for attempt in range(4):
        out = subprocess.run(["curl", "-s", "--max-time", "180", url], capture_output=True, check=True)
        body = json.loads(out.stdout)
        if not (isinstance(body, dict) and body.get("error")):
            return body
        # The free API allows a limited number of calls per minute.
        print("Open-Meteo:", body.get("reason"), "- waiting 65 s")
        time.sleep(65)
    raise RuntimeError(body.get("reason"))


def fetch_winters():
    daily = [
        "snowfall_sum",
        "precipitation_sum",
        "temperature_2m_mean",
        "relative_humidity_2m_mean",
        "wind_direction_10m_dominant",
        "wind_speed_10m_max",
    ]
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1980-01-01", "end_date": "2010-02-28",
        "daily": ",".join(daily), "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    keep = [i for i, t in enumerate(d["time"]) if t[5:7] in ("01", "02")]
    out = {
        "about": "ERA5 reanalysis via Open-Meteo, daily, grid cell centred 37.75 N 128.75 E "
                 "(about 25 km across; contains both Daegwallyeong and Gangneung). "
                 "January and February, 1980-2010. Snowfall in cm, precipitation in mm, "
                 "temperature in C, humidity in %, wind direction in degrees (from), speed in km/h. "
                 "Licence CC BY 4.0. Reanalysed, not observed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "days": [
            {
                "date": d["time"][i],
                "snow": d["snowfall_sum"][i],
                "prcp": d["precipitation_sum"][i],
                "t": d["temperature_2m_mean"][i],
                "rh": d["relative_humidity_2m_mean"][i],
                "wdir": d["wind_direction_10m_dominant"][i],
                "wspd": d["wind_speed_10m_max"][i],
            }
            for i in keep
        ],
    }
    (DATA / "winters.json").write_text(json.dumps(out, separators=(",", ":")))
    print("winters.json:", len(out["days"]), "days")


def fetch_wind(days):
    """days: list of {date, label, kind, release}. One request per day keeps each call small."""
    lats, lons = [], []
    for la in GRID_LATS:
        for lo in GRID_LONS:
            lats.append(str(la))
            lons.append(str(lo))
    out_days = []
    for day in days:
        cells = get({
            "latitude": ",".join(lats), "longitude": ",".join(lons),
            "start_date": day["date"], "end_date": day["date"],
            "hourly": "wind_speed_10m,wind_direction_10m",
            "timezone": "Asia/Seoul", "models": "era5", "wind_speed_unit": "ms",
        })
        hours = range(len(cells[0]["hourly"]["time"]))
        # speed[hour][row][col] and dir[hour][row][col], rows south to north, cols west to east
        out_days.append({**day,
            "speed": [[[cells[r * 5 + c]["hourly"]["wind_speed_10m"][i] for c in range(5)] for r in range(5)] for i in hours],
            "dir": [[[cells[r * 5 + c]["hourly"]["wind_direction_10m"][i] for c in range(5)] for r in range(5)] for i in hours]})
        time.sleep(2)
    out = {
        "about": "ERA5 reanalysis via Open-Meteo, hourly 10 m wind on a 5 x 5 grid of 0.25 degree "
                 "cells around Daegwallyeong, Korea Standard Time. Speed in m/s, direction in "
                 "degrees the wind blows from. Licence CC BY 4.0. Reanalysed, not observed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "lats": GRID_LATS,
        "lons": GRID_LONS,
        "days": out_days,
    }
    (DATA / "wind.json").write_text(json.dumps(out, separators=(",", ":")))
    print("wind.json:", len(out_days), "days")


def map_days():
    """The days the map offers, in order, with what to release particles from."""
    days = []
    picked = DATA / "candidate-days.json"
    if picked.exists():
        for d in json.loads(picked.read_text())["days"]:
            days.append({"date": d["date"], "kind": "candidate", "release": "pass",
                         "label": "2006 candidate day"})
    case = DATA / "case-2025.json"
    if case.exists():
        c = json.loads(case.read_text())
        days.append({"date": c["rite"], "kind": "rite", "release": "shrine", "label": "2025 rain rite"})
        for f in c["flight_days"]:
            days.append({"date": f, "kind": "flight", "release": None, "label": "2025 seeding flight"})
    return days


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    fetch_winters()
    days = map_days()
    if days:
        fetch_wind(days)
    else:
        print("Run tools/pick_days.py and tools/case_2025.py, then run this again for the wind field.")
