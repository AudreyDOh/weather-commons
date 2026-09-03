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
          <label className="observation-heading" htmlFor="observation-mode">
            Display
          </label>
          <select
            id="observation-mode"
            value={o.cloudOnly ? 'clouds' : 'mosaic'}
            onChange={(e) => o.setCloudOnly(e.target.value === 'clouds')}
          >
            <option value="clouds">Cloud isolation · approximate</option>
            <option value="mosaic">
              Original satellite mosaic · ground level
            </option>
          </select>
          <p>
            Wedges are missing satellite coverage—not clear sky. No weather is
            invented to fill them.
          </p>
          {o.cloudOnly && (
            <>
              <p>
                Bright, neutral pixels are isolated above the ground. Snow, ice
                and bright land can remain; thin or dark clouds may disappear.
              </p>
              <details>
                <summary>Cloud mask & height</summary>
                <label htmlFor="cloud-scale" className="observation-heading">
                  Height exaggeration
                </label>
                <select
                  id="cloud-scale"
                  value={o.cloudScale}
                  onChange={(e) => o.setCloudScale(Number(e.target.value))}
                >
                  <option value={1}>1× · true geometric scale</option>
                  <option value={50}>50× · expanded separation</option>
                  <option value={200}>200× · expanded separation</option>
                </select>
                <label className="observation-heading">
                  Assumed height <span>{o.cloudHeightKm} km</span>
                </label>
                <Slider
                  aria-label="Assumed cloud height in kilometres"
                  min={0}
                  max={12}
                  step={0.5}
                  value={[o.cloudHeightKm]}
                  onValueChange={(value) =>
                    o.setCloudHeightKm(Array.isArray(value) ? value[0] : value)
                  }
                />
                <label className="observation-heading">
                  Brightness cutoff{' '}
                  <span>{Math.round(o.cloudThreshold * 100)}%</span>
                </label>
                <Slider
                  aria-label="Cloud isolation brightness cutoff"
                  min={0.25}
                  max={0.75}
                  step={0.025}
                  value={[o.cloudThreshold]}
                  onValueChange={(value) =>
                    o.setCloudThreshold(Array.isArray(value) ? value[0] : value)
                  }
                />
                <p>
                  A single spherical shell at an assumed {o.cloudHeightKm} km.
                  At {o.cloudScale}×, the displayed separation is{' '}
                  {o.cloudHeightKm * o.cloudScale} km. True scale preserves that
                  assumed height relative to Earth’s 6,371 km radius; it does
                  not make the height a measurement.
                </p>
                <p>
                  This is a thin image shell, not volumetric clouds. Tracers and
                  map annotations remain foreground overlays.
                </p>
              </details>
            </>
          )}
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
              gaps reveal the 2004 basemap underneath. Cloud-isolation mode
              applies a brightness and colour-neutrality filter to this image;
              it is not a scientific cloud classification.
            </p>
            <p>
              The observation clock is independent of the simulation. These 2024
              images do not drive its wind or reconstruct the 1966 case. Clouds
              have no measured height in this layer. The original mosaic sits at
              ground level; the isolated view uses a separate shell with an
              explicitly assumed height.
            </p>
            <p>
              2048 × 1024 global overview, shown in monochrome. Zooming does not
              reveal additional image resolution.
            </p>
            <a href={imageryManifest.source} target="_blank" rel="noreferrer">
              NASA GIBS / source documentation ↗
            </a>
            <a
              href="https://modis.gsfc.nasa.gov/data/dataprod/mod35.php"
              target="_blank"
              rel="noreferrer"
            >
              Scientific next step / NASA MOD35 cloud mask ↗
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
