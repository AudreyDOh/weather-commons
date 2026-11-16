"""Fetch the small reanalysis files the page reads.

Source: Open-Meteo Historical Weather API (https://open-meteo.com/en/docs/historical-weather-api),
which serves ECMWF ERA5 reanalysis at 0.25 degrees (about 25 km). Licence: CC BY 4.0, cite
Open-Meteo and Copernicus ERA5. Values are reanalysed, not observed.

Writes, in data/:
  winters.json  daily ERA5 values for the grid cell over Daegwallyeong, every January and
                February from 1980 to 2010
  wind-2006.json hourly 10 m wind on a 5 x 5 grid of ERA5 cells around Daegwallyeong,
                for the 2006 candidate days chosen in pick_days.py

Run from the sketch folder:  python3 tools/fetch_weather.py
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


def fetch_wind(dates):
    lats, lons = [], []
    for la in GRID_LATS:
        for lo in GRID_LONS:
            lats.append(str(la))
            lons.append(str(lo))
    cells = get({
        "latitude": ",".join(lats), "longitude": ",".join(lons),
        "start_date": min(dates), "end_date": max(dates),
        "hourly": "wind_speed_10m,wind_direction_10m",
        "timezone": "Asia/Seoul", "models": "era5", "wind_speed_unit": "ms",
    })
    times = cells[0]["hourly"]["time"]
    keep = [i for i, t in enumerate(times) if t[:10] in dates]
    out = {
        "about": "ERA5 reanalysis via Open-Meteo, hourly 10 m wind on a 5 x 5 grid of 0.25 degree "
                 "cells around Daegwallyeong, Korea Standard Time. Speed in m/s, direction in "
                 "degrees the wind blows from. Licence CC BY 4.0. Reanalysed, not observed.",
        "fetched": time.strftime("%Y-%m-%d"),
        "lats": GRID_LATS,
        "lons": GRID_LONS,
        "times": [times[i] for i in keep],
        # speed[t][row][col] and dir[t][row][col], rows south to north, cols west to east
        "speed": [[[cells[r * 5 + c]["hourly"]["wind_speed_10m"][i] for c in range(5)] for r in range(5)] for i in keep],
        "dir": [[[cells[r * 5 + c]["hourly"]["wind_direction_10m"][i] for c in range(5)] for r in range(5)] for i in keep],
    }
    (DATA / "wind-2006.json").write_text(json.dumps(out, separators=(",", ":")))
    print("wind-2006.json:", len(out["times"]), "hours")


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    fetch_winters()
    picked = DATA / "candidate-days.json"
    if picked.exists():
        fetch_wind([d["date"] for d in json.loads(picked.read_text())["days"]])
    else:
        print("Run tools/pick_days.py, then run this again for the wind field.")
