'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Wind,
  Layers3,
  Globe2,
  Radio,
  BookOpen,
  Plus,
  X,
  Upload,
  FileJson,
  SlidersHorizontal,
  GitCompareArrows,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Globe from './globe';
import { ObservationControls } from './observation-controls';
import { useObservation } from '@/lib/weather/use-observation';
import Casebook, { GeographicAnalysis } from './casebook';
import { popeye, caseSites } from '@/lib/weather/case-study';
import { ReadingGuide, Evidence, HeightSection } from './reading-guide';
import { infrastructure } from '@/lib/weather/infrastructure';
import Link from 'next/link';
import Image from 'next/image';
import { useWeatherTools } from '@/lib/weather/use-weather-tools';
// Vite's ?worker loader supplies a default constructor at build time.
// oxlint-disable-next-line import/default
import SimulationWorker from '../../lib/weather/simulation.worker?worker';
import { atlantic, validateContribution } from '@/lib/weather/contributions';
import type { Contribution, Parameters, Snapshot } from '@/lib/weather/types';
const empty = {
  positions: new Float32Array(),
  hours: 0,
  mass: 100,
  distance: 0,
  spread: 0,
  computeMs: 0,
  finished: false,
};
function saveFile(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function WeatherLab() {
  const observation = useObservation();
  const [contribution, setContribution] = useState<Contribution>(popeye),
    [draft, setDraft] = useState<Parameters>(popeye.parameters),
    [snapshot, setSnapshot] = useState<Snapshot>(empty),
    [running, setRunning] = useState(false),
    [speed, setSpeed] = useState(1),
    [tab, setTab] = useState('experiment'),
    [panel, setPanel] = useState('casebook'),
    [guide, setGuide] = useState(-1),
    [coastVisible, setCoastVisible] = useState(true),
    [bordersVisible, setBordersVisible] = useState(true),
    [depthScale, setDepthScale] = useState(200),
    [atmosphereVisible, setAtmosphereVisible] = useState(true),
    [sectionVisible, setSectionVisible] = useState(false),
    [samplesVisible, setSamplesVisible] = useState(false),
    [regionZoom, setRegionZoom] = useState(1.15),
    [site, setSite] = useState<number | null>(null),
    [chapter, setChapter] = useState(-1),
    [modal, setModal] = useState(false),
    [notice, setNotice] = useState(''),
    [fps, setFps] = useState(0),
    [baseline, setBaseline] = useState<Snapshot | null>(null),
    [windVisible, setWindVisible] = useState(false),
    [gridVisible, setGridVisible] = useState(false),
    [placesVisible, setPlacesVisible] = useState(true),
    [runId, setRunId] = useState(1),
    [ready, setReady] = useState(false);
  const worker = useRef<Worker | null>(null),
    file = useRef<HTMLInputElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPanel('');
        setGuide(-1);
        setChapter(-1);
        setSite(null);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(contribution.parameters);
  useEffect(() => {
    const w = new SimulationWorker();
    worker.current = w;
    w.onmessage = (e: MessageEvent<Snapshot>) => {
      setSnapshot(e.data);
      setReady(true);
      if (e.data.finished) setRunning(false);
    };
    w.onerror = () =>
      setNotice(
        'The simulation worker could not start. Reload the page to retry.',
      );
    w.postMessage({ type: 'init', contribution: popeye, count: 2400 });
    w.postMessage({ type: 'running', value: false });
    w.postMessage({ type: 'seek', hours: 24 });
    return () => w.terminate();
  }, []);
  useEffect(() => {
    worker.current?.postMessage({ type: 'running', value: running });
  }, [running]);
  useEffect(() => {
    worker.current?.postMessage({ type: 'speed', value: speed });
  }, [speed]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    const pause = () =>
      worker.current?.postMessage({
        type: 'running',
        value: !document.hidden && running,
      });
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, [running]);
  const run = (c: Contribution) => {
    setContribution(c);
    setDraft(c.parameters);
    setSnapshot(empty);
    setRunId((n) => n + 1);
    worker.current?.postMessage({ type: 'init', contribution: c, count: 2400 });
    setRunning(true);
    worker.current?.postMessage({ type: 'running', value: true });
  };
  useWeatherTools(contribution, snapshot, running, run);
  const isCase = contribution.id === popeye.id;
  const activeSites = isCase ? caseSites : infrastructure;
  const focus =
    chapter >= 0
      ? { ...contribution.chapters[chapter], zoom: isCase ? 6 : 1.5 }
      : isCase
        ? { longitude: 106, latitude: 16, zoom: regionZoom }
        : { longitude: -35, latitude: 25, zoom: 1 };
  const change = (key: keyof Parameters, value: number) =>
    setDraft((p) => ({ ...p, [key]: value }));
  const importFile = async (f?: File) => {
    if (!f) return;
    try {
      if (f.size > 2_000_000)
        throw Error('Choose a contribution smaller than 2 MB.');
      const c = validateContribution(JSON.parse(await f.text()));
      run(c);
      setGuide(-1);
      setBaseline(null);
      setChapter(-1);
      setModal(false);
      setNotice('Contribution loaded. Its wind field and narrative are ready.');
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : 'Unable to read the contribution.',
      );
    }
    if (file.current) file.current.value = '';
  };
  const selectStudy = (c: Contribution) => {
    run(c);
    setRunning(false);
    worker.current?.postMessage({ type: 'running', value: false });
    worker.current?.postMessage({
      type: 'seek',
      hours: c.id === popeye.id ? 24 : 0,
    });
    setGuide(c.id === popeye.id ? -1 : 0);
    setPanel(c.id === popeye.id ? 'casebook' : '');
    setSite(null);
    setChapter(-1);
    setBaseline(null);
    setPlacesVisible(c.id === popeye.id);
    setSamplesVisible(false);
    setRegionZoom(1.15);
  };
  const readStep = (step: number) => {
    setGuide(step);
    setPanel('');
    setSite(null);
    setChapter(-1);
    setRunning(false);
    worker.current?.postMessage({ type: 'running', value: false });
    if (step === 0 || step === 3) {
      worker.current?.postMessage({ type: 'seek', hours: step === 0 ? 0 : 24 });
    }
    setWindVisible(step === 2);
    setPlacesVisible(step === 5);
    setSectionVisible(false);
  };
  return (
    <main className="weather-app">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Weather Commons home">
          <span className="brand-symbol">
            <Globe2 size={23} />
          </span>
          <span>Realtime Weather</span>
        </Link>
        <select
          className="study-select"
          aria-label="Choose a study"
          value={isCase ? 'case' : 'atlantic'}
          onChange={(e) =>
            selectStudy(e.target.value === 'case' ? popeye : atlantic)
          }
        >
          <option value="atlantic">01 — The ocean between us</option>
          <option value="case">02 — The ground as a weapon</option>
        </select>
        <nav aria-label="Workspace">
          {[
            'casebook',
            'experiment',
            'layers',
            'infrastructure',
            'evidence',
          ].map((p) => (
            <Button
              key={p}
              variant="ghost"
              aria-expanded={panel === p}
              className={panel === p ? 'nav-active' : ''}
              onClick={() => {
                if (p === 'casebook' && !isCase) {
                  setGuide(guide >= 0 ? -1 : 0);
                  setPanel('');
                  return;
                }
                setPanel(panel === p ? '' : p);
                setGuide(-1);
                if (p === 'infrastructure') setPlacesVisible(true);
                setSite(null);
                setChapter(-1);
              }}
            >
              {p === 'casebook'
                ? 'Read'
                : p === 'experiment'
                  ? 'Conditions'
                  : p === 'layers'
                    ? 'Layers'
                    : p === 'evidence'
                      ? 'Evidence'
                      : 'Sites'}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => setModal(true)}>
            Contribute <Plus size={12} />
          </Button>
        </nav>
        <div className="top-status">
          <span className="live-dot" /> LOCAL RESEARCH LAB{' '}
          <span className="version">PILOT / 0.1</span>
        </div>
      </header>
      <section className="workspace">
        <aside className="intro" hidden={panel !== 'layers'}>
          <Button
            className="panel-close"
            variant="ghost"
            size="icon-sm"
            aria-label="Close layers"
            onClick={() => setPanel('')}
          >
            <X />
          </Button>
          <div className="eyebrow">A COLLECTIVE ATMOSPHERIC INQUIRY</div>
          <ObservationControls observation={observation} />
          <h1>
            Realtime
            <br />
            <em>Weather.</em>
          </h1>
          <p className="intro-copy">
            A shared sky.
            <br />
            Many ways of knowing.
          </p>
          <div className="case-card">
            <span className="tiny-label">INVESTIGATION 001</span>
            <div className="case-line" />
            <h2>{contribution.title}</h2>
            <p>{contribution.description}</p>
            <span className="tag">
              <span />
              {contribution.kind === 'idealized'
                ? 'IDEALIZED EXPERIMENT'
                : 'IMPORTED WIND GRID'}
            </span>
          </div>
          <div className="layer-list">
            <div className="tiny-label">VISIBLE FIELDS</div>
            {[
              {
                name: 'Coastlines',
                label: 'Natural Earth · vector',
                icon: Globe2,
                value: coastVisible,
                set: setCoastVisible,
              },
              {
                name: 'Country boundaries',
                label: 'Natural Earth · Admin 0',
                icon: Globe2,
                value: bordersVisible,
                set: setBordersVisible,
              },
              {
                name: 'Atmospheric envelope',
                label: 'Assumed 12 km model ceiling',
                icon: Layers3,
                value: atmosphereVisible,
                set: setAtmosphereVisible,
              },
              {
                name: 'Wind samples',
                label: 'Nodes of the active imported grid',
                icon: Wind,
                value: samplesVisible,
                set: setSamplesVisible,
              },
              {
                name: 'Wind field',
                label: 'Prescribed circulation',
                icon: Wind,
                value: windVisible,
                set: setWindVisible,
              },
              {
                name: 'Geographic grid',
                label: '15° graticule',
                icon: Globe2,
                value: gridVisible,
                set: setGridVisible,
              },
              {
                name: 'Infrastructure & sites',
                label: 'Places behind the field',
                icon: Radio,
                value: placesVisible,
                set: setPlacesVisible,
              },
            ].map((item) => (
              <button
                className="layer"
                key={item.name}
                aria-pressed={item.value}
                onClick={() => item.set(!item.value)}
              >
                <item.icon size={15} />
                <span>
                  {item.name}
                  <small>{item.label}</small>
                </span>
                <span className={'toggle ' + (item.value ? 'on' : '')} />
              </button>
            ))}
          </div>
          <div className="depth-control">
            <label htmlFor="depth-scale">Vertical scale</label>
            <select
              id="depth-scale"
              value={depthScale}
              onChange={(e) => setDepthScale(Number(e.target.value))}
            >
              <option value={1}>True scale · 1×</option>
              <option value={50}>50×</option>
              <option value={200}>Expanded · 200×</option>
            </select>
            <p>
              Changes the view, not the calculation. Heights are above a
              reference sphere.
            </p>
            <button onClick={() => setSectionVisible(!sectionVisible)}>
              {sectionVisible ? 'Hide' : 'Show'} vertical section
            </button>
            {sectionVisible && <HeightSection snapshot={snapshot} />}
          </div>
          <button className="add-layer" onClick={() => setModal(true)}>
            <Plus size={14} /> Add an investigation <ArrowUpRight size={13} />
          </button>
          <div className="edition">
            WEATHER COMMONS × REALTIME WEATHER
            <br />
            AN OPEN LABORATORY, IN FORMATION.
          </div>
        </aside>
        <section className="planet-panel" aria-label="Atmospheric experiment">
          <div className="scene-intro">
            <span>
              {isCase
                ? 'Historical weather / hypothetical transport'
                : contribution.kind === 'idealized'
                  ? 'Synthetic field / controlled experiment'
                  : 'Imported field / contributor provenance'}
            </span>
            <button
              onClick={() => {
                if (isCase) {
                  setPanel(panel === 'casebook' ? '' : 'casebook');
                  setGuide(-1);
                } else readStep(0);
              }}
            >
              Read this study →
            </button>
            <span className="scene-source">
              {isCase
                ? 'ERA5 · 1 October 1966 · field held fixed'
                : 'NASA image · calculated particle motion'}
            </span>
          </div>
          {panel === 'casebook' && isCase && (
            <Casebook
              snapshot={snapshot}
              baseline={baseline}
              onClose={() => setPanel('')}
              onLocate={(i) => {
                setSite(i);
                setPlacesVisible(true);
                setPanel('infrastructure');
              }}
              onExperiment={() => {
                setPanel('experiment');
                setTab('experiment');
              }}
              onSamples={() => {
                setSamplesVisible((v) => !v);
                setRegionZoom(5);
                setWindVisible(false);
              }}
              onNarrative={() => {
                setPanel('');
                setChapter(0);
              }}
            />
          )}
          {guide >= 0 && (
            <ReadingGuide
              step={guide}
              onStep={readStep}
              onClose={() => setGuide(-1)}
              onExperiment={() => {
                setGuide(-1);
                setPanel('experiment');
                setTab('experiment');
              }}
              snapshot={snapshot}
              contribution={contribution}
            />
          )}
          {panel === 'evidence' && (
            <aside className="evidence-panel">
              <Button
                className="panel-close"
                variant="ghost"
                size="icon-sm"
                aria-label="Close evidence"
                onClick={() => setPanel('')}
              >
                <X />
              </Button>
              <Evidence contribution={contribution} />
              <button
                className="text-action"
                onClick={() => {
                  setPanel('');
                  setChapter(0);
                }}
              >
                Open the contribution’s narrative ↗
              </button>
            </aside>
          )}
          {panel === 'infrastructure' && (
            <aside className="network-panel">
              <Button
                className="panel-close"
                variant="ghost"
                size="icon-sm"
                aria-label="Close infrastructure"
                onClick={() => {
                  setPanel('');
                  setSite(null);
                }}
              >
                <X />
              </Button>
              <span className="tiny-label">Behind the field</span>
              <h2>
                {isCase ? 'Inhabited ground.' : 'A forecast has an address.'}
              </h2>
              <p>
                {isCase
                  ? 'Settlements as geographic anchors. Select a place to inspect its source and limits.'
                  : 'Three places in the production of atmospheric knowledge. Select a site to locate it.'}
              </p>
              {activeSites.map((n, i) => (
                <button
                  className={'network-row ' + (site === i ? 'selected' : '')}
                  key={n.id}
                  onClick={() => setSite(i)}
                >
                  <span>
                    0{i + 1} / {n.role}
                  </span>
                  <strong>{n.title}</strong>
                  <ArrowUpRight size={14} />
                </button>
              ))}
              {site !== null ? (
                <div className="site-detail">
                  {site === 2 && !isCase && (
                    <figure>
                      <Image
                        unoptimized
                        src="/data/ecmwf-bologna.jpg"
                        alt="ECMWF data centre in Bologna, a converted tobacco factory"
                        width="1000"
                        height="667"
                        loading="lazy"
                      />
                      <figcaption>
                        ECMWF · Bologna data centre · 2023
                      </figcaption>
                    </figure>
                  )}
                  <span>{activeSites[site].detail}</span>
                  <p>{activeSites[site].text}</p>
                  <h3>Why this matters</h3>
                  <p>{activeSites[site].consequence}</p>
                  <a
                    href={activeSites[site].source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Institutional source ↗
                  </a>
                </div>
              ) : (
                <p className="network-note">
                  {isCase
                    ? 'The river and settlement points are cartographic context. No historical urban footprint, flood boundary or damage map is implied.'
                    : 'Located infrastructure; no live instrument feeds. The connection joins ECMWF sites. Graciosa is shown independently.'}
                </p>
              )}
            </aside>
          )}
          <div className="planet-heading">
            <span>
              <span className="live-dot" />
              {running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}
            </span>
            <span>NORTH ATLANTIC / GLOBAL VIEW</span>
          </div>
          <Globe
            observationImage={observation.image}
            observationOpacity={observation.opacity}
            snapshot={snapshot}
            contribution={contribution}
            focus={
              site !== null
                ? { ...activeSites[site], zoom: isCase ? 8 : 2 }
                : focus
            }
            windVisible={windVisible}
            gridVisible={gridVisible}
            placesVisible={placesVisible}
            baseline={baseline}
            coastVisible={coastVisible}
            bordersVisible={bordersVisible}
            depthScale={depthScale}
            atmosphereVisible={atmosphereVisible}
            onFps={setFps}
            networkVisible={
              placesVisible && (isCase || contribution.id === atlantic.id)
            }
            sites={activeSites}
            connections={isCase ? [] : [[1, 2]]}
            samplesVisible={samplesVisible}
            caseGeography={isCase}
            selectedSite={site}
            onSite={(i) => {
              setGuide(-1);
              setSite(i);
              setPanel('infrastructure');
              setChapter(-1);
            }}
          />
          <div className="depth-caption">
            Height {depthScale === 1 ? 'at true scale' : '×' + depthScale} ·
            calculated, not observed
          </div>
          {observation.enabled && (
            <button
              className="observation-caption"
              onClick={() => setPanel('layers')}
            >
              <span>Observed / {observation.displayedDate ?? 'Loading'}</span>
              <span>
                Terra · MODIS · daily mosaic · separate from model time
              </span>
            </button>
          )}
          <div className="globe-caption">
            <span>Drag to rotate · Scroll to zoom</span>
            <span className="legend-dot" /> TRACER <span className="wind-key" />{' '}
            WIND
          </div>
          {chapter >= 0 && (
            <div className="story-card">
              <div className="story-top">
                <span className="tiny-label">
                  {contribution.chapters[chapter].label}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Close narrative"
                  onClick={() => setChapter(-1)}
                >
                  <X />
                </Button>
              </div>
              <h3>{contribution.chapters[chapter].title}</h3>
              <p>{contribution.chapters[chapter].text}</p>
              <div className="story-footer">
                {contribution.chapters[chapter].source ? (
                  <a
                    href={contribution.chapters[chapter].source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the source <ArrowUpRight size={12} />
                  </a>
                ) : (
                  <span>EXPERIMENTAL SCENARIO</span>
                )}
                <div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Previous narrative stop"
                    disabled={chapter === 0}
                    onClick={() => setChapter((c) => c - 1)}
                  >
                    <ChevronLeft />
                  </Button>
                  <span>
                    {chapter + 1} / {contribution.chapters.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Next narrative stop"
                    disabled={chapter === contribution.chapters.length - 1}
                    onClick={() => setChapter((c) => c + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="journey-bar">
            <span>
              <BookOpen size={14} /> FOLLOW THE INQUIRY
            </span>
            <div>
              {contribution.chapters.map((c, i) => (
                <button
                  key={i}
                  title={c.title}
                  aria-label={c.title}
                  aria-pressed={chapter === i}
                  className={chapter === i ? 'active' : ''}
                  onClick={() => setChapter(i)}
                >
                  {String(i + 1).padStart(2, '0')}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Start narrative journey"
              onClick={() => setChapter(0)}
            >
              <ArrowRight />
            </Button>
          </div>
        </section>
        <aside className="control-panel" hidden={panel !== 'experiment'}>
          <Button
            className="panel-close"
            variant="ghost"
            size="icon-sm"
            aria-label="Close experiment"
            onClick={() => setPanel('')}
          >
            <X />
          </Button>
          <div className="panel-tabs">
            <button
              className={tab === 'experiment' ? 'active' : ''}
              onClick={() => setTab('experiment')}
            >
              <SlidersHorizontal size={13} />
              Experiment
            </button>
            <button
              className={tab === 'methods' ? 'active' : ''}
              onClick={() => setTab('methods')}
            >
              <Info size={13} />
              Methods
            </button>
          </div>
          {tab === 'experiment' ? (
            <>
              <div className="control-heading">
                <span className="tiny-label">CHANGE THE CONDITIONS</span>
                <h2>
                  What if the
                  <br />
                  wind changes?
                </h2>
                <p>
                  Adjust the field. Release the tracers.
                  <br />
                  Wind moves the material. Spreading disperses it. Removal
                  reduces what remains.
                </p>
              </div>
              <div className="sliders">
                {[
                  {
                    key: 'wind' as const,
                    label:
                      contribution.kind === 'gridded'
                        ? 'Wind multiplier'
                        : 'Wind strength',
                    min: 0,
                    max: 40,
                    step: 1,
                    value: draft.wind,
                    display:
                      contribution.kind === 'gridded'
                        ? (draft.wind / 18).toFixed(2) + ' ×'
                        : draft.wind + ' m/s',
                  },
                  {
                    key: 'diffusion' as const,
                    label: 'Turbulent spreading',
                    min: 0,
                    max: 100000,
                    step: 1000,
                    value: draft.diffusion,
                    display: (draft.diffusion / 1000).toFixed(0) + 'k m²/s',
                  },
                  {
                    key: 'releaseHeight' as const,
                    label: 'Release height',
                    min: 0,
                    max: 12000,
                    step: 100,
                    value: draft.releaseHeight ?? 0,
                    display:
                      ((draft.releaseHeight ?? 0) / 1000).toFixed(1) + ' km',
                  },
                  {
                    key: 'verticalDiffusion' as const,
                    label: 'Vertical mixing',
                    min: 0,
                    max: 50,
                    step: 1,
                    value: draft.verticalDiffusion ?? 0,
                    display: (draft.verticalDiffusion ?? 0) + ' m²/s',
                  },
                  {
                    key: 'lifetime' as const,
                    label: 'Removal timescale',
                    min: 6,
                    max: 120,
                    step: 1,
                    value: draft.lifetime,
                    display: draft.lifetime + ' h',
                  },
                ].map((c) => (
                  <div className="control" key={c.key}>
                    <label id={'label-' + c.key}>{c.label}</label>
                    <output>{c.display}</output>
                    <Slider
                      aria-labelledby={'label-' + c.key}
                      value={[c.value]}
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      onValueChange={(v) =>
                        change(c.key, Array.isArray(v) ? v[0] : v)
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="source-inputs">
                <span className="tiny-label">RELEASE LOCATION</span>
                <div>
                  <label>
                    LONGITUDE
                    <input
                      aria-label="Release longitude"
                      type="number"
                      min="-180"
                      max="180"
                      value={draft.longitude}
                      onChange={(e) =>
                        change(
                          'longitude',
                          Math.max(-180, Math.min(180, Number(e.target.value))),
                        )
                      }
                    />
                  </label>
                  <label>
                    LATITUDE
                    <input
                      aria-label="Release latitude"
                      type="number"
                      min="-70"
                      max="70"
                      value={draft.latitude}
                      onChange={(e) =>
                        change(
                          'latitude',
                          Math.max(-70, Math.min(70, Number(e.target.value))),
                        )
                      }
                    />
                  </label>
                </div>
              </div>
              <Button
                className="run-button"
                onClick={() => {
                  try {
                    run(
                      validateContribution({
                        ...contribution,
                        parameters: draft,
                      }),
                    );
                    setNotice('New run started with the same random seed.');
                  } catch (e) {
                    setNotice((e as Error).message);
                  }
                }}
              >
                <Play size={14} fill="currentColor" />
                {dirty ? 'Apply & rerun' : 'Release & rerun'}
                <span>↗</span>
              </Button>
              <div className="run-note">
                {dirty
                  ? 'UNAPPLIED CHANGES'
                  : 'SAME SEED · REPRODUCIBLE CONDITIONS'}
              </div>
              <div className="readouts">
                <div className="readout-title">
                  <span className="tiny-label">LIVE READOUT</span>
                  <span>RUN {String(runId).padStart(2, '0')}</span>
                </div>
                <div>
                  <span>Distance from release</span>
                  <strong>
                    {Math.round(snapshot.distance).toLocaleString()}
                    <small>km</small>
                  </strong>
                </div>
                <div>
                  <span>
                    Plume spread{' '}
                    <abbr title="Root mean square distance from the plume center">
                      RMS
                    </abbr>
                  </span>
                  <strong>
                    {Math.round(snapshot.spread)}
                    <small>km</small>
                  </strong>
                </div>
                <div>
                  <span>Tracer remaining</span>
                  <strong>
                    {snapshot.mass.toFixed(1)}
                    <small>%</small>
                  </strong>
                </div>
              </div>
              {isCase && (
                <GeographicAnalysis snapshot={snapshot} baseline={baseline} />
              )}
              <p className="metric-explanation">
                Mean height: {((snapshot.meanHeight ?? 0) / 1000).toFixed(2)}{' '}
                km. Distance is mean horizontal displacement; spread is not a
                hazard zone. Remaining weight is not an exposure estimate.
              </p>
              <Button
                variant="outline"
                className="compare-button"
                onClick={() => {
                  if (baseline) {
                    setBaseline(null);
                  } else {
                    setBaseline({
                      ...snapshot,
                      positions: snapshot.positions.slice(),
                      heights: snapshot.heights?.slice(),
                    });
                    setNotice(
                      'Snapshot pinned in blue. Rerun and seek to the same hour for a comparison.',
                    );
                  }
                }}
              >
                <GitCompareArrows size={14} />
                {baseline ? 'Clear comparison' : 'Pin this state to compare'}
              </Button>
              {baseline && (
                <p className="compare-note">
                  CYAN SNAPSHOT · T+{baseline.hours.toFixed(1)} H<br />
                  Compare runs at the same elapsed time.
                </p>
              )}
            </>
          ) : (
            <div className="methods">
              <span className="tiny-label">HOW TO READ THIS</span>
              <h2>
                Make the
                <br />
                assumptions visible.
              </h2>
              <p>{contribution.source.note}</p>
              <dl>
                <dt>Integrator</dt>
                <dd>Explicit midpoint (RK2)</dd>
                <dt>Numerical timestep</dt>
                <dd>300 seconds, fixed</dd>
                <dt>Release footprint</dt>
                <dd>
                  {contribution.parameters.releaseRadiusKm ?? 189} km radius ·
                  hypothetical
                </dd>
                <dt>Particles</dt>
                <dd>2,400 weighted tracers</dd>
                <dt>Random seed</dt>
                <dd>{contribution.parameters.seed}</dd>
                <dt>Domain</dt>
                <dd>
                  {contribution.kind === 'gridded'
                    ? 'Imported grid; absorbing edges'
                    : 'Sphere; latitude capped at ±85°'}
                </dd>
                <dt>Vertical motion</dt>
                <dd>
                  Random-walk diffusion; 0–12 km reflecting boundaries. No wind
                  shear or terrain.
                </dd>
                <dt>Mass process</dt>
                <dd>Exponential decay, e⁻ᵗ/τ</dd>
                <dt>Basemap</dt>
                <dd>
                  NASA Blue Marble · January 2004 · 5,400 × 2,700. Static
                  composite, about 8 km/pixel; display shading is illustrative.
                  Natural Earth coastline and country-boundary overlays.
                </dd>
                <dt>Source license</dt>
                <dd>{contribution.source.license}</dd>
              </dl>
              <a
                className="source-link"
                href={contribution.source.url}
                target="_blank"
                rel="noreferrer"
              >
                Source / method reference <ArrowUpRight size={14} />
              </a>
              <p className="method-warning">
                Wind strokes indicate direction; their screen animation is not
                the simulation clock. Tracer size and glow are visual symbols,
                not cloud extent.
              </p>
            </div>
          )}
          <div className="performance">
            <span className="live-dot" />
            {ready ? 'WORKER CONNECTED' : 'STARTING WORKER'}
            <span>{fps} FPS</span>
          </div>
        </aside>
      </section>
      <footer className="timeline">
        <div className="transport">
          <Button
            className="play-button"
            size="icon"
            aria-label={running ? 'Pause simulation' : 'Play simulation'}
            onClick={() => {
              if (snapshot.finished) {
                run(contribution);
              } else setRunning((r) => !r);
            }}
          >
            {running ? (
              <Pause fill="currentColor" />
            ) : (
              <Play fill="currentColor" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Reset simulation"
            onClick={() => run(contribution)}
          >
            <RotateCcw size={15} />
          </Button>
          <select
            aria-label="Playback speed"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          >
            <option value="1">1 h / s</option>
            <option value="3">3 h / s</option>
            <option value="6">6 h / s</option>
            <option value="12">12 h / s</option>
          </select>
        </div>
        <div className="time-value">
          <span>ELAPSED MODEL TIME</span>
          <strong>
            T + {String(Math.floor(snapshot.hours)).padStart(2, '0')}
            <small>h</small>{' '}
            {String(Math.round((snapshot.hours % 1) * 60)).padStart(2, '0')}
            <small>m</small>
          </strong>
        </div>
        <div className="time-scrubber">
          <input
            type="range"
            aria-label="Elapsed model time"
            min="0"
            max="72"
            step="1"
            value={snapshot.hours}
            onChange={(e) => {
              setRunning(false);
              worker.current?.postMessage({ type: 'running', value: false });
              worker.current?.postMessage({
                type: 'seek',
                hours: Number(e.target.value),
              });
            }}
          />
          <div>
            <span>RELEASE</span>
            <span>24 H</span>
            <span>48 H</span>
            <span>72 H</span>
          </div>
        </div>
        <Button
          variant="ghost"
          className="export-button"
          onClick={() =>
            saveFile(contribution.id + '-run.json', {
              ...contribution,
              parameters: contribution.parameters,
              run: {
                elapsedHours: snapshot.hours,
                metrics: {
                  mass: snapshot.mass,
                  distance: snapshot.distance,
                  spread: snapshot.spread,
                },
                positions: Array.from(snapshot.positions),
                heightsMetres: Array.from(snapshot.heights ?? []),
                model: 'transport-v2-vertical-diffusion',
                heightReference: 'smooth sphere; not terrain',
              },
            })
          }
        >
          <ArrowDownToLine size={15} />
          Export run
        </Button>
      </footer>
      <div className="bottomline">
        <span>
          CALCULATED IN YOUR BROWSER ·{' '}
          {contribution.kind === 'idealized'
            ? 'SYNTHETIC WIND / NOT A WEATHER FORECAST'
            : 'IMPORTED STATIONARY WIND / NOT A WEATHER FORECAST'}
        </span>
        <a
          href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/"
          target="_blank"
          rel="noreferrer"
        >
          Earth imagery: NASA · Jan 2004 ↗
        </a>
      </div>
      {notice && (
        <output className="toast" aria-live="polite">
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
          >
            <X size={14} />
          </button>
        </output>
      )}
      <dialog
        ref={dialog}
        onCancel={() => setModal(false)}
        className="contribution-dialog"
      >
        <div className="dialog-header">
          <span className="tiny-label">THE COLLECTIVE WORKSPACE</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close contribution dialog"
            onClick={() => setModal(false)}
          >
            <X />
          </Button>
        </div>
        <span className="dialog-icon">
          <Layers3 size={25} />
        </span>
        <h2>
          Bring your piece
          <br />
          of the atmosphere.
        </h2>
        <p>
          One portable contribution connects your wind field, experiment,
          sources, and spatial narrative to this shared interface.
        </p>
        <div className="contribution-steps">
          <div>
            <span>01</span>
            <strong>Start with a template</strong>
            <p>Change the inquiry, conditions, and narrative stops.</p>
          </div>
          <div>
            <span>02</span>
            <strong>Add a field</strong>
            <p>Use the analytical model or a regular u/v wind grid in m/s.</p>
          </div>
          <div>
            <span>03</span>
            <strong>Load and investigate</strong>
            <p>
              Your contribution runs locally. Export it to exchange with others.
            </p>
          </div>
        </div>
        <div className="dialog-actions">
          <Button
            variant="outline"
            onClick={() => saveFile('weather-commons-template.json', atlantic)}
          >
            <FileJson size={15} />
            Get template
          </Button>
          <Button onClick={() => file.current?.click()}>
            <Upload size={15} />
            Load contribution
          </Button>
        </div>
        <input
          ref={file}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => importFile(e.target.files?.[0])}
        />
        <p className="dialog-note">
          JSON · MAX 2 MB · SCHEMA V1
          <br />
          This pilot has no accounts, shared storage, or live collaboration.
        </p>
      </dialog>
    </main>
  );
}
