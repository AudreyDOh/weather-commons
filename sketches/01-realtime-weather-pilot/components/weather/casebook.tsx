'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  archive,
  historicalSource,
  civilianSource,
  caseSites,
} from '@/lib/weather/case-study';
import type { Snapshot } from '@/lib/weather/types';
import { publicUrl } from '@/lib/weather/public-url';
type Props = {
  snapshot: Snapshot;
  baseline: Snapshot | null;
  onClose: () => void;
  onLocate: (i: number) => void;
  onExperiment: () => void;
  onSamples: () => void;
  onNarrative: () => void;
};
const titles = [
  'The archive',
  'The weather',
  'Inhabited ground',
  'The instruments of knowing',
];
export default function Casebook({
  snapshot,
  baseline,
  onClose,
  onLocate,
  onExperiment,
  onSamples,
  onNarrative,
}: Props) {
  const [page, setPage] = useState(0),
    [day, setDay] = useState(0);
  const total = archive.rain.mm.reduce((a, b) => a + b, 0),
    peak = Math.max(...archive.rain.mm);
  return (
    <section className="casebook" aria-label="Military weather case study">
      <div className="casebook-top">
        <span>Field study 02 / Laos, 1966–67</span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close case study"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <h1>
        The ground
        <br />
        as a weapon.
      </h1>
      <div className="case-index">
        {titles.map((t, i) => (
          <button
            key={t}
            className={page === i ? 'selected' : ''}
            onClick={() => setPage(i)}
            aria-label={t}
            aria-pressed={page === i}
          >
            {String(i + 1).padStart(2, '0')}
          </button>
        ))}
        <span>{titles[page]}</span>
      </div>
      {page === 0 && (
        <div className="case-body">
          <p>
            What happens when weather becomes a means of controlling movement?
          </p>
          <p>
            A declassified memorandum records Popeye tests in the Se Kong valley
            in October 1966. The proposal that followed sought to prolong rain
            and obstruct routes through Laos and North Vietnam.
          </p>
          <div className="claim-pair">
            <span>Documented</span>
            <p>Military intent; reported tests; anticipated civilian risks.</p>
            <span>Not established here</span>
            <p>
              The amount of extra rain, or a causal account of damage to people
              and crops.
            </p>
          </div>
          <p className="case-aside">
            A wet archive does not tell us what would have happened without
            intervention.
          </p>
          <a
            className="footnote"
            href={historicalSource}
            target="_blank"
            rel="noreferrer"
          >
            [1] Kohler to Rusk, 13 January 1967 ↗
          </a>
          <button className="case-action" onClick={onNarrative}>
            Follow the places in the record →
          </button>
        </div>
      )}
      {page === 1 && (
        <div className="case-body">
          <p>
            This is an actual dataset: ERA5 reanalysis, retrieved through
            Open-Meteo. It reconstructs weather by combining observations and a
            numerical model.
          </p>
          <div className="archive-measure">
            <strong>{total.toFixed(1)}</strong>
            <span>
              mm / October 1966
              <br />
              15.5° N, 107° E
            </span>
          </div>
          <svg
            className="rain-chart"
            viewBox="0 0 310 95"
            aria-label="Daily reanalysis precipitation in October 1966"
          >
            <path d="M2 73H307" stroke="currentColor" opacity=".3" />
            {archive.rain.mm.map((v, i) => (
              <rect
                key={i}
                x={i * 9.8 + 3}
                y={73 - (v / peak) * 62}
                width="5.5"
                height={Math.max(0.6, (v / peak) * 62)}
                fill="currentColor"
                opacity={i === day ? 1 : 0.4}
              />
            ))}
            <text x="3" y="92">
              1 October
            </text>
            <text x="305" y="92" textAnchor="end">
              31 October
            </text>
          </svg>
          <label className="rain-day">
            {archive.rain.dates[day]} · {archive.rain.mm[day].toFixed(1)} mm
            <input
              type="range"
              min="0"
              max="30"
              value={day}
              aria-label="Inspect rainfall day"
              onChange={(e) => setDay(Number(e.target.value))}
            />
          </label>
          <p className="case-aside">
            Reconstructed precipitation at one grid point, not a rain-gauge
            record or a measure of seeding effectiveness. The date slider
            inspects rainfall; it does not change the wind experiment.
          </p>
          <button className="case-action" onClick={onSamples}>
            Reveal the 49 wind samples →
          </button>
          <details>
            <summary>Provenance & downloads</summary>
            <p>
              ERA5 input sampled every 1°; product grid 0.25°. Wind at 100 m
              above ground, 1 October 1966 at 00 UTC. The experiment holds that
              single field fixed. The assumed release is not a recorded mission.
            </p>
            <a href={publicUrl('/data/archive/era5-wind-raw.json')} download>
              Raw wind response ↓
            </a>
            <a href={publicUrl('/data/archive/era5-rain-raw.json')} download>
              Raw rainfall response ↓
            </a>
            <a href={publicUrl('/data/popeye-archive.json')} download>
              Processed grid & request URLs ↓
            </a>
            <a
              href="https://open-meteo.com/en/docs/historical-weather-api"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo / ERA5 documentation ↗
            </a>
          </details>
        </div>
      )}
      {page === 2 && (
        <div className="case-body">
          <p>
            The military plan made roads, fords and bridges into targets of
            environmental intervention. It anticipated disruptions to civilian
            movement and cultivation.
          </p>
          <p>
            A separate, documented legacy of bombing remains in Laos: unexploded
            ordnance restricts farming and the construction of roads and
            schools. This is not evidence of harm caused by Popeye.
          </p>
          <div className="place-index">
            {caseSites.map((p, i) => (
              <button key={p.id} onClick={() => onLocate(i)}>
                <span>{p.title}</span>
                <span>↗</span>
              </button>
            ))}
          </div>
          <p className="case-aside">
            Mapped settlements are present-day geographic references. No
            historical building inventory or population distribution has been
            fabricated.
          </p>
          <a
            className="footnote"
            href={civilianSource}
            target="_blank"
            rel="noreferrer"
          >
            [2] UN Lao PDR, war legacy and development, 2018 ↗
          </a>
          <a
            className="footnote"
            href={historicalSource}
            target="_blank"
            rel="noreferrer"
          >
            [1] Planning document, civilian impacts ↗
          </a>
        </div>
      )}
      {page === 3 && (
        <div className="case-body">
          <div className="model-entry">
            <span>Dataset / used here</span>
            <h2>ERA5</h2>
            <p>
              A global reanalysis. Its archived wind is the input to this case;
              it is not direct observation at every grid point.
            </p>
          </div>
          <div className="model-entry">
            <span>Established model / reference</span>
            <h2>HYSPLIT</h2>
            <p>
              NOAA’s trajectory and dispersion system. It provides a
              methodological reference; this browser is not running HYSPLIT.
            </p>
            <a
              href="https://www.arl.noaa.gov/hysplit/"
              target="_blank"
              rel="noreferrer"
            >
              NOAA model documentation ↗
            </a>
          </div>
          <div className="model-entry">
            <span>Working model / calculated here</span>
            <h2>Particle transport</h2>
            <p>
              2,400 weighted tracers; a 25 km hypothetical release; bilinear
              wind sampling, five-minute integration and prescribed mixing.
              Surface-height wind is applied over a smooth sphere. No cloud
              seeding, rainfall response or runoff is solved.
            </p>
          </div>
          <GeographicAnalysis snapshot={snapshot} baseline={baseline} />
          <button className="case-action" onClick={onExperiment}>
            Change one assumption →
          </button>
        </div>
      )}
      <div className="casebook-bottom">
        <span>{page + 1} / 4</span>
        <button onClick={() => setPage((page + 1) % 4)}>
          {page === 3 ? 'Return to the archive' : 'Continue'} →
        </button>
      </div>
    </section>
  );
}
export function GeographicAnalysis({
  snapshot,
  baseline,
}: {
  snapshot: Snapshot;
  baseline: Snapshot | null;
}) {
  const near = caseSites.map((site) => {
    let weight = 0,
      minKm = Infinity;
    for (let i = 0; i < snapshot.positions.length; i += 3) {
      if (!snapshot.positions[i + 2]) continue;
      const lat = snapshot.positions[i + 1],
        lon = snapshot.positions[i];
      const a = ((lat - site.latitude) * Math.PI) / 180,
        b = ((lon - site.longitude) * Math.PI) / 180;
      const h =
        Math.sin(a / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((site.latitude * Math.PI) / 180) *
          Math.sin(b / 2) ** 2;
      const km = 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
      minKm = Math.min(minKm, km);
      if (km <= 25) weight += snapshot.positions[i + 2];
    }
    return {
      name: site.label,
      minKm,
      share: (weight / Math.max(1, snapshot.positions.length / 3)) * 100,
    };
  });
  return (
    <div className="geo-analysis">
      <span>Calculated / T + {snapshot.hours.toFixed(1)} h</span>
      <h2>Where does the assumption travel?</h2>
      <p>
        {Math.round(snapshot.distance)} km mean displacement.{' '}
        {snapshot.mass.toFixed(1)}% of initial weight remains.
      </p>
      {near.map((n) => (
        <div key={n.name}>
          <span>{n.name}</span>
          <strong>
            {Number.isFinite(n.minKm) ? Math.round(n.minKm) + ' km' : '—'} /{' '}
            {n.share.toFixed(1)}%
          </strong>
        </div>
      ))}
      <p className="case-aside">
        Nearest active tracer / share of initial model weight within 25 km
        horizontally. This is geometric proximity, not measured exposure or a
        hazard zone.
      </p>
      {baseline && (
        <p className="case-aside">
          {Math.abs(baseline.hours - snapshot.hours) < 0.09
            ? `Against the pinned state: ${(snapshot.distance - baseline.distance).toFixed(0)} km change in mean displacement.`
            : 'Seek to the pinned time before comparing displacement.'}
        </p>
      )}
    </div>
  );
}
