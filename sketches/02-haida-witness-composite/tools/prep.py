#!/usr/bin/env python3
"""Prepare calendar assets for the artifact: cal/true/<date>.jpg (1800x900), cal/chl/<date>.png
(900x450 grey: 0 no data, 1..255 chlorophyll level from the GIBS rainbow palette), cal/thumb/<date>.jpg,
cal/index.json."""
import json, pathlib, sys
import numpy as np
from PIL import Image

SRC = pathlib.Path(sys.argv[1]); DST = pathlib.Path(sys.argv[2])
for d in ("true", "chl", "thumb"):
    (DST / d).mkdir(parents=True, exist_ok=True)

def hue_val(rgb):
    r, g, b = [rgb[..., i].astype(float) / 255 for i in range(3)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); d = mx - mn + 1e-9
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    t = (300 - np.clip(h, 0, 300)) / 300 * 0.85
    red = (h < 1) & (mx < 0.99)
    t = np.where(red, 0.85 + (1 - mx) / 0.6 * 0.15, t)
    return np.clip(t, 0, 1)

idx = json.load(open(SRC / "index.json"))
out = []
for e in idx:
    d = e["date"]
    t = Image.open(SRC / f"{d}_true.jpg").convert("RGB")
    t.save(DST / "true" / f"{d}.jpg", quality=82, optimize=True)
    t.resize((300, 150), Image.LANCZOS).save(DST / "thumb" / f"{d}.jpg", quality=80, optimize=True)
    c = np.asarray(Image.open(SRC / f"{d}_chl.png").convert("RGBA"))
    v = hue_val(c[..., :3]); a = c[..., 3] > 0
    g = np.where(a, 1 + np.round(v * 254), 0).astype(np.uint8)
    Image.fromarray(g, "L").resize((900, 450), Image.BOX).save(DST / "chl" / f"{d}.png", optimize=True)
    e2 = dict(e); e2["chl_mean"] = round(float(v[a].mean()) if a.any() else 0, 3)
    out.append(e2)
json.dump(out, open(DST / "index.json", "w"), indent=1)
print(len(out), "days;", sum(p.stat().st_size for p in DST.rglob("*") if p.is_file()) // 1024, "KB")
