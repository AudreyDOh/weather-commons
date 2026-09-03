'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, RotateCcw, Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { goesManifest, useGoesFrame } from '@/lib/weather/use-goes-frame';

const products = goesManifest.products;
const timeLabel = (value: string) => value.slice(11, 16) + ' UTC';

function ImagePlate({
  view,
  target,
}: {
  view: ReturnType<typeof useGoesFrame>;
  target: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [camera, setCamera] = useState({ zoom: 1, x: 0, y: 0 });
  useEffect(() => {
    const node = viewport.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      setCamera((previous) => {
        const zoom = Math.max(
          1,
          Math.min(4, previous.zoom * Math.exp(-event.deltaY * 0.0015)),
        );
        const bounds = node.getBoundingClientRect();
        return {
          zoom,
          x: Math.max(
            (-bounds.width * (zoom - 1)) / 2,
            Math.min((bounds.width * (zoom - 1)) / 2, previous.x),
          ),
          y: Math.max(
            (-bounds.height * (zoom - 1)) / 2,
            Math.min((bounds.height * (zoom - 1)) / 2, previous.y),
          ),
        };
      });
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  }, []);
  return (
    <figure className="goes-figure">
      <div
        ref={viewport}
        className="goes-image-viewport"
        onPointerDown={(event) => {
          drag.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x,
            dy = event.clientY - drag.current.y;
          drag.current = { x: event.clientX, y: event.clientY };
          const bounds = event.currentTarget.getBoundingClientRect();
          setCamera((previous) => ({
            ...previous,
            x: Math.max(
              (-bounds.width * (previous.zoom - 1)) / 2,
              Math.min(
                (bounds.width * (previous.zoom - 1)) / 2,
                previous.x + dx,
              ),
            ),
            y: Math.max(
              (-bounds.height * (previous.zoom - 1)) / 2,
              Math.min(
                (bounds.height * (previous.zoom - 1)) / 2,
                previous.y + dy,
              ),
            ),
          }));
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        {view.loaded && (
          <Image
            unoptimized
            src={view.loaded.frame.file}
            alt={`${view.loaded.product.label}, GOES-19 full disk at ${view.loaded.frame.time}. Original NOAA processing.`}
            width={view.loaded.frame.width}
            height={view.loaded.frame.height}
            draggable={false}
            style={{
              transform: `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`,
            }}
          />
        )}
        {(!view.ready || view.error) && (
          <output className="goes-loading">
            {view.error
              ? `${target} unavailable. Return to the 3D lab or select another product.`
              : `Loading ${target}…`}
          </output>
        )}
      </div>
      <figcaption>
        <span>
          {view.loaded?.product.label ?? target} /{' '}
          {view.loaded ? timeLabel(view.loaded.frame.time) : 'Loading'}
        </span>
        <span className="goes-zoom">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Zoom out of ${target}`}
            onClick={() =>
              setCamera((previous) => ({
                zoom: Math.max(1, previous.zoom / 1.3),
                x: 0,
                y: 0,
              }))
            }
          >
            <Minus size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Zoom into ${target}`}
            onClick={() =>
              setCamera((previous) => ({
                ...previous,
                zoom: Math.min(4, previous.zoom * 1.3),
              }))
            }
          >
            <Plus size={13} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Reset ${target} image view`}
            onClick={() => setCamera({ zoom: 1, x: 0, y: 0 })}
          >
            <RotateCcw size={13} />
          </Button>
        </span>
      </figcaption>
    </figure>
  );
}

export default function GoesLab({ onClose }: { onClose: () => void }) {
  const [productId, setProductId] = useState('airmass');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [compare, setCompare] = useState(false);
  const product = products.find((item) => item.id === productId)!;
  const reference = products.find(
    (item) => item.id === (productId === 'geocolor' ? 'airmass' : 'geocolor'),
  )!;
  const view = useGoesFrame(product, index);
  const paired = useGoesFrame(compare ? reference : null, index);
  const lastIndex = product.frames.length - 1;
  const ready = view.ready && (!compare || paired.ready);
  const failed = view.error || (compare && paired.error);
  useEffect(() => {
    if (!playing || !ready || failed) return;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (index >= lastIndex) {
        setPlaying(false);
        return;
      }
      setIndex((previous) => previous + 1);
    }, speed);
    return () => clearInterval(timer);
  }, [playing, ready, failed, index, lastIndex, speed]);

  return (
    <section className="goes-lab" aria-label="GOES satellite image laboratory">
      <aside className="goes-notes">
        <div className="goes-eyebrow">03 / Instrument view</div>
        <h1>
          Ways of seeing
          <br />
          the atmosphere
        </h1>
        <p>One satellite. Different measurements. Different skies.</p>
        <nav className="goes-products" aria-label="GOES image product">
          {products.map((item, i) => (
            <Button
              key={item.id}
              variant="ghost"
              aria-pressed={item.id === productId}
              onClick={() => {
                setPlaying(false);
                setProductId(item.id);
                if (item.frames.length === 1) {
                  setIndex(0);
                  setCompare(false);
                }
              }}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>{item.label}</span>
              <span aria-hidden="true">
                {item.id === productId ? '●' : '○'}
              </span>
            </Button>
          ))}
        </nav>
        <div className="goes-product-note">
          <span className="goes-eyebrow">{product.kind}</span>
          <p>{product.summary}</p>
        </div>
        <Button
          className="goes-compare"
          variant="outline"
          disabled={product.frames.length === 1}
          aria-pressed={compare}
          onClick={() => setCompare((value) => !value)}
        >
          {compare ? 'Single view' : `Compare with ${reference.label}`}
        </Button>
        <details>
          <summary>Read this image</summary>
          <p>
            The image keeps NOAA’s original colour, coastlines, legends and
            full-disk geometry. Its apparent depth is the satellite view, not
            measured cloud-height geometry.
          </p>
          <p>
            These are archived observations from{' '}
            {goesManifest.start.slice(0, 10)}. Four products share the same
            twelve acquisition labels at ten-minute intervals. Derived winds are
            a separate, dated still.
          </p>
          <p>
            Wind barbs and boundaries are baked into the supplied images. They
            cannot yet be toggled or queried independently. Return to the 3D lab
            for the pilot’s separate vector and tracer layers.
          </p>
          <p>
            Scroll to inspect the original {view.loaded?.frame.width ?? 1808}
            -pixel source. Zoom adds no new data. No artificial lighting, cloud
            keying or colour filter is applied.
          </p>
          <a href={product.source} target="_blank" rel="noreferrer">
            NOAA product and interpretation ↗
          </a>
          <a href="/data/archive/goes/manifest.json" download>
            Sources, dates & hashes ↓
          </a>
        </details>
        <Button variant="ghost" onClick={onClose}>
          Return to the 3D lab ↗
        </Button>
      </aside>
      <div className="goes-main">
        <header className="goes-heading">
          <span>GOES-19 / ABI / NOAA–NESDIS–STAR</span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close GOES image laboratory"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </header>
        <div
          className={'goes-plates' + (compare ? ' goes-plates-compare' : '')}
        >
          <ImagePlate view={view} target={product.label} />
          {compare && <ImagePlate view={paired} target={reference.label} />}
        </div>
        <div className="goes-playback">
          <div className="goes-playback-head">
            <Button
              variant="ghost"
              disabled={lastIndex === 0 || (!playing && (!ready || failed))}
              aria-label={
                playing ? 'Pause GOES sequence' : 'Play GOES sequence'
              }
              onClick={() => {
                if (index >= lastIndex) setIndex(0);
                setPlaying((value) => !value);
              }}
            >
              {playing ? <Pause size={14} /> : <Play size={14} />}{' '}
              {playing
                ? 'Pause'
                : index >= lastIndex && lastIndex > 0
                  ? 'Replay'
                  : 'Play'}
            </Button>
            <span>
              {view.loaded?.frame.time.slice(0, 10) ??
                goesManifest.start.slice(0, 10)}{' '}
              / {view.loaded ? timeLabel(view.loaded.frame.time) : 'Loading'}
            </span>
            {lastIndex > 0 && (
              <select
                aria-label="GOES playback speed"
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
              >
                <option value={1000}>Slow</option>
                <option value={500}>Medium</option>
                <option value={250}>Fast</option>
              </select>
            )}
          </div>
          {lastIndex > 0 && (
            <Slider
              aria-label="GOES acquisition time"
              min={0}
              max={lastIndex}
              step={1}
              value={[index]}
              onValueChange={(value) => {
                setPlaying(false);
                setIndex(Array.isArray(value) ? value[0] : value);
              }}
            />
          )}
          <div className="goes-playback-foot">
            <span>
              {lastIndex > 0
                ? `${timeLabel(product.frames[0].time)} — ${timeLabel(product.frames[lastIndex].time)} · 10 min / source frame`
                : 'Retrieved winds · one dated source image'}
            </span>
            <span>Archived / model clock independent</span>
          </div>
          {failed && (
            <output>
              Image loading failed. Choose another product or return to the 3D
              lab.
            </output>
          )}
        </div>
      </div>
    </section>
  );
}
