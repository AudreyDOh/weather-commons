"""Pick 'seedable' days and line up the snow around them.

Reads data/winters.json (from fetch_weather.py) and writes:
  candidate-days.json  January-February 2006 days that match the seeding conditions
  epoch.json           mean snowfall from 5 days before to 5 days after matching days,
                       for 2006 and for the winters 1980-2005, against all winter days
  totals.json          January-February snowfall total for each winter, 1980-2010

The rule comes from the abstract of Lee et al. 2009 (doi:10.1007/s00376-009-0222-x):
the 2006 experiments were run on easterly, foggy days with high humidity. The exact
experiment dates are in the paywalled full text, so these are candidate days that match
the stated conditions, not the confirmed experiment days.

Run from the sketch folder:  python3 tools/pick_days.py
"""

import json
import pathlib

HERE = pathlib.Path(__file__).resolve().parent.parent
DATA = HERE / "data"

# Easterly: the dominant wind blows from between north-east and south-east.
EAST = (45, 135)
MIN_RH = 80   # % daily mean relative humidity, our stand-in for "foggy, high humidity"
MAX_T = 0     # C daily mean temperature, cold enough for snow
SPAN = 5      # days before and after


def seedable(d):
    return (None not in (d["wdir"], d["rh"], d["t"])
            and EAST[0] <= d["wdir"] <= EAST[1] and d["rh"] >= MIN_RH and d["t"] <= MAX_T)


def mean(xs):
    xs = [x for x in xs if x is not None]
    return round(sum(xs) / len(xs), 3) if xs else None


def main():
    days = json.loads((DATA / "winters.json").read_text())["days"]
    index = {d["date"]: i for i, d in enumerate(days)}

    def window(date):
        i = index[date]
        row = []
        for k in range(-SPAN, SPAN + 1):
            j = i + k
            # stay inside the same winter, so 28 Feb is not followed by 1 Jan of next year
            same = 0 <= j < len(days) and days[j]["date"][:4] == date[:4]
            row.append(days[j]["snow"] if same else None)
        return row

    def profile(dates):
        rows = [window(d) for d in dates]
        return [mean([r[k] for r in rows]) for k in range(2 * SPAN + 1)]

    match = [d["date"] for d in days if seedable(d)]
    cand = [d for d in match if d.startswith("2006-")]
    before = [d for d in match if d[:4] <= "2005"]
    winter_mean = mean([d["snow"] for d in days if d["date"][:4] <= "2005"])

    rule = (f"Dominant 10 m wind from {EAST[0]}-{EAST[1]} degrees, daily mean relative humidity "
            f">= {MIN_RH} %, daily mean temperature <= {MAX_T} C, in the ERA5 cell over Daegwallyeong.")
    (DATA / "candidate-days.json").write_text(json.dumps({
        "about": "Candidate days in January-February 2006 that match the conditions described in "
                 "Lee et al. 2009. Not the confirmed experiment days. " + rule,
        "days": [days[index[d]] for d in cand],
    }, indent=1))

    (DATA / "epoch.json").write_text(json.dumps({
        "about": "Mean daily ERA5 snowfall (cm) from 5 days before to 5 days after each matching day. "
                 + rule + " Reanalysed, not observed.",
        "offsets": list(range(-SPAN, SPAN + 1)),
        "y2006": {"n": len(cand), "snow": profile(cand)},
        "before": {"n": len(before), "years": "1980-2005", "snow": profile(before)},
        "winter_mean": winter_mean,
    }, indent=1))

    totals = {}
    for d in days:
        if d["snow"] is not None:
            totals[d["date"][:4]] = totals.get(d["date"][:4], 0) + d["snow"]
    (DATA / "totals.json").write_text(json.dumps({
        "about": "January-February ERA5 snowfall total (cm) in the cell over Daegwallyeong, per winter. "
                 "Reanalysed, not observed.",
        "years": [{"year": int(y), "snow": round(v, 1)} for y, v in sorted(totals.items())],
    }, indent=1))

    print(f"{len(match)} matching days in 1980-2010, {len(cand)} in 2006, {len(before)} in 1980-2005")
    print("2006 candidates:", ", ".join(cand))


if __name__ == "__main__":
    main()
