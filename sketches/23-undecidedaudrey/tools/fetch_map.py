"""Fetch the base map: terrain heights and places.

Writes, in data/:
  terrain.json   ground height (m) on a 0.01 degree grid over the map frame, from the
                 Open-Meteo Elevation API (Copernicus DEM GLO-90, about 90 m). The page
                 draws the coast where the height is 0.
  places.json    the points on the map, with where each position comes from

Run from the sketch folder:  python3 tools/fetch_map.py
Needs Python 3 and curl.
"""

import json
import pathlib
import subprocess
import time
import urllib.parse

HERE = pathlib.Path(__file__).resolve().parent.parent
DATA = HERE / "data"

# Map frame: south, north, west, east (degrees).
FRAME = (37.50, 37.90, 128.45, 129.05)
STEP = 0.01

# Positions from OpenStreetMap (ODbL), looked up on 2026-11-16, except where noted.
PLACES = [
    {"id": "pass", "name": "Daegwallyeong pass", "ko": "대관령", "lat": 37.6844, "lon": 128.7542,
     "kind": "place", "from": "OpenStreetMap, Daegwallyeong rest area at the old pass road"},
    {"id": "shrine", "name": "Guksaseonghwangsa and Sansindang", "ko": "대관령 국사성황사·산신당",
     "lat": 37.6965, "lon": 128.7542, "kind": "ritual",
     "from": "OpenStreetMap node 대관령국사성황사; the mountain-god shrine stands beside it"},
    {"id": "hoenggye", "name": "Hoenggye", "ko": "횡계 (대관령면)", "lat": 37.6755, "lon": 128.7077,
     "kind": "place", "from": "OpenStreetMap, Daegwallyeong-myeon"},
    {"id": "yongpyong", "name": "Yongpyong", "ko": "용평", "lat": 37.6282, "lon": 128.6777,
     "kind": "place", "from": "OpenStreetMap, Yongpyong Resort"},
    {"id": "seonjaryeong", "name": "Seonjaryeong", "ko": "선자령", "lat": 37.7224, "lon": 128.7452,
     "kind": "place", "from": "OpenStreetMap, saddle"},
    {"id": "gangneung", "name": "Gangneung", "ko": "강릉", "lat": 37.7518, "lon": 128.8759,
     "kind": "place", "from": "OpenStreetMap, Gangneung city hall"},
    {"id": "gn_station", "name": "Gangneung weather station", "ko": "강릉 관측소", "lat": 37.771,
     "lon": 128.868, "kind": "instrument", "from": "NOAA GHCN-Daily station list, KSM00047105"},
]


def curl(url):
    out = subprocess.run(["curl", "-sL", "--max-time", "180", url], capture_output=True, check=True)
    return out.stdout


def fetch_terrain():
    s, n, w, e = FRAME
    rows = round((n - s) / STEP) + 1
    cols = round((e - w) / STEP) + 1
    pts = [(round(s + r * STEP, 4), round(w + c * STEP, 4)) for r in range(rows) for c in range(cols)]
    heights = []
    for i in range(0, len(pts), 100):  # the API takes up to 100 points per call
        chunk = pts[i:i + 100]
        url = "https://api.open-meteo.com/v1/elevation?" + urllib.parse.urlencode({
            "latitude": ",".join(str(p[0]) for p in chunk),
            "longitude": ",".join(str(p[1]) for p in chunk),
        }, safe=",")
        for attempt in range(4):
            body = json.loads(curl(url))
            if "elevation" in body:
                break
            print("Open-Meteo:", body.get("reason"), "- waiting 65 s")
            time.sleep(65)
        heights += [round(h) for h in body["elevation"]]
        time.sleep(0.5)
    (DATA / "terrain.json").write_text(json.dumps({
        "about": "Ground height in metres from the Open-Meteo Elevation API (Copernicus DEM GLO-90, "
                 "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018, provided under "
                 "COPERNICUS by the European Union and ESA). 0 at sea.",
        "frame": {"south": s, "north": n, "west": w, "east": e, "step": STEP},
        "rows": rows, "cols": cols,
        # heights[row * cols + col], row 0 = south
        "heights": heights,
    }, separators=(",", ":")))
    print("terrain.json:", rows, "x", cols)


def write_places():
    (DATA / "places.json").write_text(json.dumps({
        "about": "Map points. Positions from OpenStreetMap (© OpenStreetMap contributors, ODbL) and the "
                 "NOAA GHCN-Daily station list. The 2006 generator site is not public, so the page shows "
                 "an approximate experiment area around the pass instead.",
        "places": PLACES,
    }, ensure_ascii=False, indent=1))
    print("places.json:", len(PLACES), "points")


if __name__ == "__main__":
    DATA.mkdir(exist_ok=True)
    write_places()
    fetch_terrain()
