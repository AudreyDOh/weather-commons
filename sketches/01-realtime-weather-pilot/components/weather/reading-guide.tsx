'use client';
import { ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Contribution, Snapshot } from '@/lib/weather/types';
type Props = {
  step: number;
  onStep: (step: number) => void;
  onClose: () => void;
  onExperiment: () => void;
  snapshot: Snapshot;
  contribution: Contribution;
};
export function ReadingGuide({
  step,
  onStep,
  onClose,
  onExperiment,
  snapshot,
  contribution,
}: Props) {
  const p = contribution.parameters;
  const steps = [
    {
      label: 'Read the image',
      title: 'A real Earth. A hypothetical release.',
      body: 'The surface is a satellite-derived composite. The white points are a calculated experiment. They are not clouds seen by a satellite.',
      note: 'Move through this explanation at your own pace. The model starts paused.',
    },
    {
      label: 'Identify the data',
      title: 'Different layers. Different kinds of evidence.',
      body: 'NASA’s January 2004 composite supplies the surface image. Natural Earth supplies generalized coastlines and country boundaries. Neither supplies the wind in this experiment.',
      note:
        contribution.kind === 'idealized'
          ? 'The wind is a stationary mathematical field designed for this pilot. There is no live weather feed.'
          : 'The wind comes from the imported u/v grid. Its status—observed, modeled or synthetic—must be established from the contributor’s source.',
    },
    {
      label: 'Run the procedure',
      title: 'Release. Move. Mix. Remove.',
      body: `We track 2,400 weighted points, initially at ${((p.releaseHeight ?? 0) / 1000).toFixed(1)} km. Every five simulated minutes, wind moves them horizontally; random steps spread them sideways and vertically. Their weights gradually decline.`,
      note: 'A point represents a share of hypothetical material, not a raindrop or a measured air sample. Next, calculate 24 hours.',
    },
    {
      label: 'Read the calculation',
      title: 'A path through an atmospheric volume.',
      body: `At ${snapshot.hours.toFixed(1)} model hours, mean displacement is ${Math.round(snapshot.distance).toLocaleString()} km; ${snapshot.mass.toFixed(1)}% of the initial weight remains. Mean height is ${((snapshot.meanHeight ?? 0) / 1000).toFixed(2)} km above the reference sphere.`,
      note: 'Height is calculated, but exaggerated on the globe so you can see it. Switch to true scale in Earth. The height reference is the solver’s sphere, not the exaggerated terrain.',
    },
    {
      label: 'Ask what is absent',
      title: 'Geography is visible. Its physics is mostly absent.',
      body: 'Real mountains redirect and lift air. Surface heating drives mixing; clouds and rain can remove particles. Here, the landscape supplies visual context: its geometry does not change the prescribed wind.',
      note: 'The solver has no terrain interaction, rain, ocean exchange, buoyancy, chemistry or height-dependent wind. The reflecting 12 km ceiling is an assumed model boundary, not a measured tropopause.',
    },
    {
      label: 'Interpret carefully',
      title: 'A route is a question—not an impact estimate.',
      body: 'This experiment can compare pathways and sensitivity to assumptions. It cannot establish exposure, toxicity, rainfall or ecological damage. Those require a real release, time-varying weather, concentrations and validation.',
      note: 'Try a controlled comparison: pin this 24-hour state; change only wind strength; rerun and return to 24 hours. Then ask which instruments could test the difference, and who has access to their evidence.',
    },
  ];
  const current = steps[step];
  return (
    <section className="reading-guide" aria-label="Guided explanation">
      <div className="guide-top">
        <span>
          {String(step + 1).padStart(2, '0')} / 06 — {current.label}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Close guided explanation"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <h2>{current.title}</h2>
      <p>{current.body}</p>
      <p className="guide-note">{current.note}</p>
      {step === 3 && <HeightSection snapshot={snapshot} />}
      <div className="guide-footer">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Previous explanation"
          disabled={step === 0}
          onClick={() => onStep(step - 1)}
        >
          <ArrowLeft />
        </Button>
        <button
          className="guide-next"
          onClick={() => (step === 5 ? onExperiment() : onStep(step + 1))}
        >
          {step === 5
            ? 'Change one condition'
            : step === 2
              ? 'Calculate 24 hours'
              : 'Continue'}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
export function HeightSection({ snapshot }: { snapshot: Snapshot }) {
  const points: { x: number; y: number }[] = [];
  let min = Infinity,
    max = -Infinity;
  for (let i = 0; i < snapshot.positions.length; i += 3) {
    if (!snapshot.positions[i + 2]) continue;
    min = Math.min(min, snapshot.positions[i]);
    max = Math.max(max, snapshot.positions[i]);
  }
  for (let i = 0; i < snapshot.positions.length; i += 12) {
    if (!snapshot.positions[i + 2]) continue;
    points.push({
      x: 16 + ((snapshot.positions[i] - min) / Math.max(1, max - min)) * 238,
      y: 108 - ((snapshot.heights?.[i / 3] ?? 0) / 12000) * 90,
    });
  }
  return (
    <figure className="height-section">
      <svg
        viewBox="0 0 280 132"
        aria-label="Calculated particle height against longitude. Height axis runs from zero to twelve kilometres; no terrain is included."
      >
        <path d="M16 16V108H266" fill="none" stroke="#ffffff40" />
        <path
          d="M16 63H266M16 18H266"
          stroke="#ffffff16"
          strokeDasharray="2 4"
        />
        <text x="20" y="14">
          12 km
        </text>
        <text x="20" y="103">
          0
        </text>
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r=".9" fill="white" opacity=".6" />
        ))}
        <text x="16" y="126">
          {Number.isFinite(min) ? min.toFixed(1) : '—'}°
        </text>
        <text x="264" y="126" textAnchor="end">
          {Number.isFinite(max) ? max.toFixed(1) : '—'}° longitude
        </text>
      </svg>
      <figcaption>
        Calculated vertical distribution · axes use different scales
      </figcaption>
    </figure>
  );
}
export function Evidence({ contribution }: { contribution: Contribution }) {
  return (
    <div className="evidence-content">
      <span className="tiny-label">Evidence / assumptions</span>
      <h2>What you are looking at.</h2>
      <details open>
        <summary>01 / Observed imagery</summary>
        <p>
          NASA Blue Marble, January 2004. A processed satellite-derived surface
          composite, not a current photograph or live weather. Display lighting
          is illustrative.
        </p>
        <a
          href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/"
          target="_blank"
          rel="noreferrer"
        >
          NASA source ↗
        </a>
      </details>
      <details>
        <summary>02 / Mapped geography</summary>
        <p>
          Natural Earth coastlines and Admin-0 land boundary lines. Generalized
          cartographic reference, not parcel boundaries. National lines do not
          constrain airflow. Disputed borders follow the source’s
          representation.
        </p>
        <a
          href="https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-boundary-lines-2/"
          target="_blank"
          rel="noreferrer"
        >
          Natural Earth source ↗
        </a>
      </details>
      <details>
        <summary>03 / Wind input</summary>
        <p>
          {contribution.kind === 'idealized'
            ? 'Synthetic jet and rotating flow. It is prescribed rather than solved from atmospheric pressure or temperature.'
            : 'Imported stationary u/v grid, bilinearly interpolated. Importing does not verify whether its values are observations, a reanalysis or synthetic.'}
        </p>
        <p>{contribution.source.note}</p>
        <a href={contribution.source.url} target="_blank" rel="noreferrer">
          Contributor’s method / source ↗
        </a>
      </details>
      <details>
        <summary>04 / Calculated motion</summary>
        <p>
          Horizontal movement uses midpoint integration every 300 seconds.
          Random steps have a standard deviation of √(2KΔt), separately for
          horizontal and vertical mixing. Heights reflect at 0 and 12 km. The
          same horizontal wind applies at every height.
        </p>
        <p>
          Remaining weight follows exp(−time / timescale). This generic loss is
          not identified as rainout, chemistry or deposition. Imported-grid
          exits also remove weight.
        </p>
        <a
          href="https://www.ready.noaa.gov/hysplitusersguide/S000.htm"
          target="_blank"
          rel="noreferrer"
        >
          Related particle-transport methods ↗
        </a>
      </details>
      <details>
        <summary>05 / Representation</summary>
        <p>
          Particle heights are in metres above a smooth sphere, not height above
          terrain. The globe defaults to 200× vertical exaggeration. The faint
          shell marks the assumed 12 km ceiling. Tethers locate material on the
          map; they are not deposition. Brightness and dot density are not
          calibrated concentrations.
        </p>
      </details>
      <details>
        <summary>06 / Institutions & consequence</summary>
        <p>
          Source-linked institutional locations provide context. They are not
          live sensor feeds or proven inputs to this model. No exposure,
          rainfall, health or ecosystem impact is calculated. Test pathways
          first, then document what additional evidence an impact claim would
          need.
        </p>
      </details>
    </div>
  );
}
