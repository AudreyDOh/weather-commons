'use client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  imageryManifest,
  type Observation,
} from '@/lib/weather/use-observation';

export function ObservationControls({
  observation: o,
}: {
  observation: Observation;
}) {
  return (
    <section
      className="observation-controls"
      aria-label="Satellite observation archive"
    >
      <div className="observation-heading">
        <span>01 / Observed imagery</span>
        <Button
          variant="ghost"
          aria-pressed={o.enabled}
          onClick={() => o.setEnabled(!o.enabled)}
        >
          {o.enabled ? 'Hide' : 'Show sequence'}
        </Button>
      </div>
      <p>Six days above Earth. Terra / MODIS, 24–29 September 2024.</p>
      {o.enabled && (
        <>
          <div className="observation-heading">
            <time dateTime={o.displayedDate ?? undefined}>
              {o.displayedDate ?? 'Loading first frame'}
            </time>
            <Button
              variant="ghost"
              disabled={!o.playing && o.status !== 'ready'}
              aria-label={
                o.playing
                  ? 'Pause satellite sequence'
                  : 'Play satellite sequence'
              }
              onClick={() => o.setPlaying(!o.playing)}
            >
              {o.playing ? 'Pause' : 'Play'}
            </Button>
          </div>
          <Slider
            aria-label="Satellite observation date"
            min={0}
            max={imageryManifest.frames.length - 1}
            step={1}
            value={[o.index]}
            onValueChange={(value) => {
              o.setPlaying(false);
              o.setIndex(Array.isArray(value) ? value[0] : value);
            }}
          />
          <div className="observation-endpoints">
            <span>24 Sep</span>
            <span>29 Sep</span>
          </div>
          <label className="observation-heading">
            Imagery opacity <span>{Math.round(o.opacity * 100)}%</span>
          </label>
          <Slider
            aria-label="Satellite imagery opacity"
            min={0}
            max={1}
            step={0.05}
            value={[o.opacity]}
            onValueChange={(value) =>
              o.setOpacity(Array.isArray(value) ? value[0] : value)
            }
          />
          <output>
            {o.status === 'error'
              ? 'Frame unavailable. The last loaded date remains displayed. Hide and show to retry.'
              : o.status === 'loading'
                ? `Loading ${imageryManifest.frames[o.index].date}…`
                : 'Daily satellite mosaics. Playback advances one day per frame.'}
          </output>
          <details>
            <summary>What am I seeing?</summary>
            <p>
              Actual corrected-reflectance imagery, combining ground, ocean and
              clouds. Satellite passes occur at different times within each day;
              gaps reveal the 2004 basemap underneath.
            </p>
            <p>
              The observation clock is independent of the simulation. These 2024
              images do not drive its wind or reconstruct the 1966 case. Clouds
              have no measured height in this layer.
            </p>
            <p>
              2048 × 1024 global overview, shown in monochrome. Zooming does not
              reveal additional image resolution.
            </p>
            <a href={imageryManifest.source} target="_blank" rel="noreferrer">
              NASA GIBS / source documentation ↗
            </a>
            <a href="/data/imagery/manifest.json" download>
              Download frame sources & hashes ↓
            </a>
          </details>
        </>
      )}
    </section>
  );
}
