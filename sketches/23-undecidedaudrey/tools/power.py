"""How many trials would it take to tell a seeding effect from chance?

The standard sample-size formula for comparing two means (seeded and unseeded days):

    n per group = 2 * (z_alpha + z_beta)^2 * (cv / e)^2

  cv       coefficient of variation of daily rain on days that could be seeded (sd / mean)
  e        the effect, as a fraction of the mean (0.10 = seeding adds 10 %)
  z_alpha  1.645 for a one-sided test at 5 %
  z_beta   0.842 for an 80 % chance of detecting a real effect

cv comes from ERA5 daily precipitation for the cell over Daegwallyeong: days with 1 mm or more,
16 August to 15 September, 1940-2024 ("seedable" because seeding needs clouds that already rain).
A Monte Carlo check then draws real ERA5 days (with replacement) into seeded and unseeded groups, adds the effect
to the seeded group, and counts how often a t-test finds it, to see whether the formula holds
for rain this skewed.

Writes data/power.json. Run from the sketch folder:  python3 tools/power.py
Needs Python 3 and curl.
"""

import json
import math
import random
import statistics
import time

from fetch_weather import CELL, DATA, get

Z_ALPHA, Z_BETA = 1.645, 0.842
EFFECTS = [0.01, 0.02, 0.03, 0.05, 0.1, 0.15, 0.2, 0.3, 0.5]

# Trials actually run, from the sources in the README.
TRIALS = [
    {"label": "2006 ground", "n": 9, "source": "Lee et al. 2009"},
    {"label": "2025 flights", "n": 10, "source": "SBS, 10 Sep 2025"},
    {"label": "2008–2018 aircraft", "n": 54, "source": "Cha et al. 2019, Atmosphere 29(4)"},
]


def n_needed(cv, e):
    return math.ceil(2 * (Z_ALPHA + Z_BETA) ** 2 * (cv / e) ** 2)


def detects(pool, n, e, rng):
    # Draw with replacement: the n needed can be larger than the number of real rainy days.
    seeded = [x * (1 + e) for x in rng.choices(pool, k=n)]
    unseeded = rng.choices(pool, k=n)
    m1, m0 = statistics.fmean(seeded), statistics.fmean(unseeded)
    se = math.sqrt(statistics.variance(seeded) / n + statistics.variance(unseeded) / n)
    return (m1 - m0) / se > Z_ALPHA


def main():
    d = get({
        "latitude": CELL[0], "longitude": CELL[1],
        "start_date": "1940-01-01", "end_date": "2024-12-31",
        "daily": "precipitation_sum", "timezone": "Asia/Seoul", "models": "era5",
    })["daily"]
    pool = [p for t, p in zip(d["time"], d["precipitation_sum"])
            if p is not None and p >= 1 and ("08-16" <= t[5:] <= "09-15")]
    mean, sd = statistics.fmean(pool), statistics.stdev(pool)
    cv = sd / mean

    rng = random.Random(23)
    checks = []
    for e in (0.1, 0.3):
        n = n_needed(cv, e)
        reps = 300
        hits = sum(detects(pool, n, e, rng) for _ in range(reps))
        checks.append({"effect": e, "n_per_group": n, "share_detected": round(hits / reps, 2)})

    out = {
        "about": "Sample size to tell a seeding effect from chance, from ERA5 daily rain in the cell over "
                 "Daegwallyeong on days with 1 mm or more, 16 Aug - 15 Sep, 1940-2024. Formula: n per group = "
                 "2 (z_alpha + z_beta)^2 (cv / e)^2, one-sided 5 % test, 80 % power. Reanalysed rain, modelled test.",
        "fetched": time.strftime("%Y-%m-%d"),
        "days": len(pool),
        "mean_mm": round(mean, 2),
        "sd_mm": round(sd, 2),
        "cv": round(cv, 3),
        "z_alpha": Z_ALPHA,
        "z_beta": Z_BETA,
        "needed": [{"effect": e, "n_per_group": n_needed(cv, e)} for e in EFFECTS],
        "monte_carlo": checks,
        "trials": TRIALS,
    }
    (DATA / "power.json").write_text(json.dumps(out, indent=1))
    print(f"{len(pool)} seedable days, mean {mean:.1f} mm, sd {sd:.1f} mm, cv {cv:.2f}")
    for row in out["needed"]:
        print(f"  effect {row['effect']:.0%}: {row['n_per_group']} seeded and {row['n_per_group']} unseeded days")
    print("  Monte Carlo:", checks)


if __name__ == "__main__":
    main()
