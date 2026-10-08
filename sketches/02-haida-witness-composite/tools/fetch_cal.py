#!/usr/bin/env python3
"""Fetch a MODIS Aqua calendar over the Haida frame from the Worldview snapshot API.
Pass 1: chlorophyll PNG (transparent where no data) for candidate dates -> coverage.
Pass 2: true colour JPEG for kept dates -> cloud fraction (bright grey pixels).
Writes OUT/<date>_true.jpg, OUT/<date>_chl.png, OUT/index.json."""
import io, json, pathlib, sys, time
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import numpy as np, requests
from PIL import Image

OUT = pathlib.Path(sys.argv[1]); OUT.mkdir(parents=True, exist_ok=True)
W, H = 1800, 900
BBOX = "49,-145,58,-127"
API = "https://wvs.earthdata.nasa.gov/api/v1/snapshot"
S = requests.Session()

def snap(layers, day, fmt):
    p = dict(REQUEST="GetSnapshot", LAYERS=layers, CRS="EPSG:4326", TIME=day, BBOX=BBOX, FORMAT=fmt, WIDTH=W, HEIGHT=H)
    for a in range(3):
        try:
            r = S.get(API, params=p, timeout=120)
            if r.status_code == 200 and len(r.content) > 2000:
                return r.content
            err = f"HTTP {r.status_code} {len(r.content)}"
        except Exception as e:
            err = type(e).__name__
        time.sleep(3 * (a + 1))
    raise RuntimeError(err)

def chl(day):
    f = OUT / f"{day}_chl.png"
    if not f.exists():
        f.write_bytes(snap("MODIS_Aqua_L2_Chlorophyll_A", day, "image/png"))
    a = np.asarray(Image.open(f).convert("RGBA"))[..., 3]
    return day, float((a > 0).mean())

def true(day):
    f = OUT / f"{day}_true.jpg"
    if not f.exists():
        f.write_bytes(snap("MODIS_Aqua_CorrectedReflectance_TrueColor", day, "image/jpeg"))
    im = np.asarray(Image.open(f).convert("RGB")).astype(int)
    lum = im.mean(2); sat = im.max(2) - im.min(2)
    cloud = (lum > 150) & (sat < 40)
    black = lum < 8
    return day, float(cloud.mean()), float(black.mean())

if __name__ == "__main__":
    d0, d1 = date(2012, 6, 10), date(2012, 10, 30)
    cands = [str(d0 + timedelta(days=i)) for i in range(0, (d1 - d0).days + 1, 4)]
    with ThreadPoolExecutor(4) as ex:
        cov = dict(ex.map(chl, cands))
    print({k: round(v, 3) for k, v in cov.items()})
    keep = sorted(cov, key=lambda d: -cov[d])[:18]
    # always keep the key witnesses
    for must in ("2012-08-29", "2012-07-20", "2012-09-14"):
        if must not in keep:
            if must not in cov:
                cov[must] = chl(must)[1]
            keep.append(must)
    keep = sorted(set(keep))
    with ThreadPoolExecutor(4) as ex:
        tc = {d: (c, b) for d, c, b in ex.map(true, keep)}
    idx = [dict(date=d, chl=round(cov[d], 4), cloud=round(tc[d][0], 4), nodata=round(tc[d][1], 4)) for d in keep]
    json.dump(idx, open(OUT / "index.json", "w"), indent=1)
    print(json.dumps(idx, indent=1))
