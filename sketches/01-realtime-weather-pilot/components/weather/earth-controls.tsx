'use client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { useSatellite } from '@/lib/weather/use-satellite';

export function SatelliteControls({
  satellite: s,
  onLocate,
}: {
  satellite: ReturnType<typeof useSatellite>;
  onLocate: () => void;
}) {
  return (
    <section className="earth-controls" aria-label="GOES globe layer">
      <div className="control-row">
        <span>01 / Satellite observation</span>
        <Button
          variant="ghost"
          aria-pressed={s.enabled}
          onClick={() => {
            s.setHeightEnabled(false);
            s.setEnabled(!s.enabled);
            s.setPlaying(false);
          }}
        >
          {s.enabled ? 'Hide' : 'Show'}
        </Button>
      </div>
      <label htmlFor="satellite-product">Spectral product</label>
      <select
        id="satellite-product"
        value={s.productId}
        onChange={(e) => {
          s.setHeightEnabled(false);
          s.setProductId(e.target.value);
          s.setIndex(0);
          s.setPlaying(false);
          s.setEnabled(true);
        }}
      >
        {s.products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      <p>{s.product.summary}</p>
      <div className="control-row">
        <span>
          {s.heightEnabled
            ? s.height.manifest.frames[
                s.height.loaded?.index ?? s.index
              ].start.slice(11, 16)
            : (s.view.loaded?.frame.time.slice(11, 16) ?? 'Loading')}{' '}
          UTC
        </span>
        <Button
          variant="ghost"
          disabled={
            (!s.enabled && !s.heightEnabled) || !s.ready || s.frameCount === 1
          }
          onClick={() => {
            if (s.index === s.frameCount - 1) s.setIndex(0);
            s.setPlaying(!s.playing);
          }}
        >
          {s.playing ? 'Pause' : 'Play observations'}
        </Button>
      </div>
      {s.product.frames.length > 1 && (
        <Slider
          aria-label="Satellite acquisition frame"
          min={0}
          max={s.product.frames.length - 1}
          step={1}
          value={[s.index]}
          onValueChange={(value) => {
            s.setIndex(Array.isArray(value) ? value[0] : value);
            s.setPlaying(false);
          }}
        />
      )}
      <p className="micro-note">
        03 Sep 2026 · 10 minutes per observation.
        <br />
        Independent of the simulation clock.
      </p>
      {s.view.error && (
        <p role="alert">Satellite image unavailable. Choose another product.</p>
      )}
      <label>
        Image opacity · {Math.round(s.opacity * 100)}%
        <Slider
          aria-label="Satellite opacity"
          min={0}
          max={1}
          step={0.05}
          value={[s.opacity]}
          onValueChange={(v) => s.setOpacity(Array.isArray(v) ? v[0] : v)}
        />
      </label>
      <details>
        <summary>Position, colour and height</summary>
        <p>
          NOAA’s published colour composite is projected geographically onto the
          globe. Its built-in map lines stay in the image; our vector boundaries
          are a separate layer.
        </p>
        <p>
          JPEG registration uses nominal GOES-19 geometry. It is approximate,
          especially at the limb. Colours are product-specific; they do not
          measure cloud height. No lighting is added to satellite colours.
        </p>
        <label htmlFor="satellite-lift">Display separation</label>
        <select
          id="satellite-lift"
          value={s.lift}
          onChange={(e) => s.setLift(Number(e.target.value))}
        >
          <option value={0}>On geographic surface</option>
          <option value={6}>6 km × vertical scale · assumed</option>
        </select>
        <p>
          Lifting this layer separates the image for reading. It does not
          reconstruct a cloud volume.
        </p>
        <a href={s.product.source} target="_blank" rel="noreferrer">
          NOAA / NESDIS / STAR ↗
        </a>
        <a href="/data/archive/goes/manifest.json" download>
          Original images and provenance ↓
        </a>
      </details>
      <details>
        <summary>Retrieved cloud-top geometry</summary>
        <p>
          NOAA ACHA estimates cloud-top height from infrared measurements. Only
          good-quality samples are shown. Gaps are retained; there is no
          cloud-base or density model.
        </p>
        <Button
          variant="outline"
          aria-pressed={s.heightEnabled}
          onClick={() => {
            s.setHeightEnabled(!s.heightEnabled);
            s.setIndex(0);
            s.setPlaying(false);
            onLocate();
          }}
        >
          {s.heightEnabled ? 'Return to imagery' : 'Show retrieved cloud tops'}
        </Button>
        <label htmlFor="cloud-height-scale">Cloud height display scale</label>
        <select
          id="cloud-height-scale"
          value={s.heightScale}
          onChange={(e) => s.setHeightScale(Number(e.target.value))}
        >
          <option value={1}>True scale · 1×</option>
          <option value={20}>Exaggerated · 20×</option>
          <option value={50}>Exaggerated · 50×</option>
          <option value={100}>Exaggerated · 100×</option>
        </select>
        <p>
          Height colours: 0–20 km. About 20 km between displayed samples at
          nadir. Scan duration about 10 minutes. Display triangles do not add
          measurements.
        </p>
        <a href={s.height.manifest.algorithm} target="_blank" rel="noreferrer">
          NOAA retrieval algorithm ↗
        </a>
        <a href="/data/archive/cloud-height/manifest.json" download>
          Raw NetCDF, quality flags and transforms ↓
        </a>
        {s.height.error && <p role="alert">{s.height.error}</p>}
      </details>
      <Button variant="outline" onClick={onLocate}>
        Locate GOES hemisphere ↗
      </Button>
    </section>
  );
}

export function ReliefControls(p: {
  detailEnabled: boolean;
  setDetailEnabled: (value: boolean) => void;
  onTerrain: () => void;
  terrain: boolean;
  setTerrain: (v: boolean) => void;
  scale: number;
  setScale: (v: number) => void;
  ocean: boolean;
  setOcean: (v: boolean) => void;
  opacity: number;
  setOpacity: (v: number) => void;
  buildings: boolean;
  setBuildings: (v: boolean) => void;
  onRelief: () => void;
  onBuildings: () => void;
}) {
  return (
    <section className="earth-controls" aria-label="Earth geometry layers">
      <span className="micro-note">02 / Ground, water, buildings</span>
      <div className="control-row">
        <span>Terrain + seafloor</span>
        <Button
          variant="ghost"
          aria-pressed={p.terrain}
          onClick={() => p.setTerrain(!p.terrain)}
        >
          {p.terrain ? 'On' : 'Off'}
        </Button>
      </div>
      <label htmlFor="terrain-scale">Relief scale</label>
      <select
        id="terrain-scale"
        value={p.scale}
        onChange={(e) => p.setScale(Number(e.target.value))}
      >
        <option value={1}>True scale · 1×</option>
        <option value={20}>Exaggerated · 20×</option>
        <option value={60}>Exaggerated · 60×</option>
      </select>
      <p>
        NOAA ETOPO1 elevation in metres. Land rises; the ocean floor falls below
        sea level. An overview grid, not local terrain.
      </p>
      <div className="control-row">
        <span>Sea-level surface</span>
        <Button
          variant="ghost"
          aria-pressed={p.ocean}
          onClick={() => p.setOcean(!p.ocean)}
        >
          {p.ocean ? 'On' : 'Off'}
        </Button>
      </div>
      <label>
        Water opacity · {Math.round(p.opacity * 100)}%
        <Slider
          aria-label="Water opacity"
          min={0}
          max={1}
          step={0.05}
          value={[p.opacity]}
          onValueChange={(v) => p.setOpacity(Array.isArray(v) ? v[0] : v)}
        />
      </label>
      <Button variant="outline" onClick={p.onRelief}>
        Inspect Atlantic relief ↗
      </Button>
      <Button variant="outline" onClick={p.onTerrain}>
        Enter regional terrain / Rainier ↗
      </Button>
      <div className="control-row">
        <span>Regional detail on approach</span>
        <Button
          variant="ghost"
          aria-pressed={p.detailEnabled}
          onClick={() => p.setDetailEnabled(!p.detailEnabled)}
        >
          {p.detailEnabled ? 'On' : 'Off'}
        </Button>
      </div>
      <details>
        <summary>What loads as I zoom?</summary>
        <p>
          The Rainier sample loads progressively finer terrain and aerial
          textures as you approach. Coarse tiles remain while detail arrives.
          Its best elevation samples are about 60 m apart; the aerial mosaic is
          about 8 m per pixel. This regional archive has a finite edge.
        </p>
        <p>
          USGS 3DEP bare-earth elevation, shown at 1× height, with NAIP imagery.
          Aerial and terrain dates differ. This is not live weather or a
          street-scale survey.
        </p>
        <a href="/data/archive/rainier/manifest.json" download>
          Regional sources, tile transforms and hashes ↓
        </a>
      </details>
      <div className="control-row">
        <span>Built fabric / NYC sample</span>
        <Button
          variant="ghost"
          aria-pressed={p.buildings}
          onClick={() => p.setBuildings(!p.buildings)}
        >
          {p.buildings ? 'On' : 'Off'}
        </Button>
      </div>
      <Button variant="outline" onClick={p.onBuildings}>
        Enter Lower Manhattan ↗
      </Button>
      <details>
        <summary>Geometry and its limits</summary>
        <p>
          522 OpenStreetMap footprints, extruded at true height scale. Heights
          use a source tag, an assumed 3 metres per level, or a labelled 9-metre
          fallback. USGS NAIP aerial imagery textures the ground and flat roofs;
          walls remain plain. These are not surveyed facades.
        </p>
        <p>
          The city sample uses a local flat sea-level datum, with coarse global
          terrain hidden. It does not establish flood depth, exposure or damage.
        </p>
        <p>
          Atmospheric shells describe assumed display heights. No building,
          terrain or satellite layer changes the tracer calculation.
        </p>
        <a href="/data/archive/earth/manifest.json" download>
          Geometry sources and transforms ↓
        </a>
        <a
          href="https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer"
          target="_blank"
          rel="noreferrer"
        >
          Aerial photography / USGS NAIP · catalogue 2019–2023 ↗
        </a>
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap contributors ↗
        </a>
      </details>
    </section>
  );
}
