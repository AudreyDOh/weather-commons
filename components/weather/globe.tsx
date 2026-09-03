'use client';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createEarthScene } from '@/lib/weather/earth-scene';
import type { infrastructure } from '@/lib/weather/infrastructure';
import type { Contribution, Snapshot } from '@/lib/weather/types';
import type { CloudHeightFrame } from '@/lib/weather/cloud-height';
import type { EarthInspection } from '@/lib/weather/earth-inspection';

export type GlobeProps = {
  onInspect: (value: EarthInspection) => void;
  retrievedCloud: CloudHeightFrame | null;
  retrievedCloudVisible: boolean;
  retrievedCloudScale: number;
  transportVisible: boolean;
  observationImage: HTMLImageElement | null;
  observationOpacity: number;
  cloudOnly: boolean;
  cloudHeightKm: number;
  cloudScale: number;
  cloudThreshold: number;
  cloudSoftness: number;
  observationPlaying: boolean;
  snapshot: Snapshot | null;
  contribution: Contribution;
  focus: { longitude: number; latitude: number; zoom?: number };
  sites: typeof infrastructure;
  connections: number[][];
  samplesVisible: boolean;
  caseGeography: boolean;
  windVisible: boolean;
  gridVisible: boolean;
  placesVisible: boolean;
  baseline: Snapshot | null;
  coastVisible: boolean;
  bordersVisible: boolean;
  depthScale: number;
  atmosphereVisible: boolean;
  onFps: (fps: number) => void;
  onReset: () => void;
  networkVisible: boolean;
  selectedSite: number | null;
  onSite: (index: number) => void;
  goesImage: HTMLImageElement | null;
  goesEnabled: boolean;
  goesOpacity: number;
  satelliteLiftKm: number;
  lightBackground: boolean;
  terrainVisible: boolean;
  terrainScale: number;
  oceanVisible: boolean;
  oceanOpacity: number;
  buildingsVisible: boolean;
  fabricFocus: boolean;
};

export default function Globe(props: GlobeProps) {
  const canvas = useRef<HTMLCanvasElement>(null),
    current = useRef(props),
    world = useRef<ReturnType<typeof createEarthScene> | null>(null);
  const target = useRef({ lon: -75.2, lat: 12, zoom: 1 }),
    view = useRef({ lon: -75.2, lat: 12, zoom: 1 });
  const drag = useRef<{
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    current.current = props;
  }, [props]);
  useEffect(() => {
    target.current = {
      lon: props.focus.longitude,
      lat: props.focus.latitude,
      zoom: props.focus.zoom ?? 1,
    };
  }, [props.focus.longitude, props.focus.latitude, props.focus.zoom]);
  useEffect(() => {
    const el = canvas.current!;
    try {
      world.current = createEarthScene(el, setError);
    } catch {
      queueMicrotask(() =>
        setError('3D renderer unavailable. This view needs WebGL2.'),
      );
      return;
    }
    const resize = () => {
      const box = el.getBoundingClientRect();
      world.current?.resize(box.width, box.height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current.zoom = Math.max(
        0.65,
        Math.min(
          50000,
          target.current.zoom *
            Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.025 : 0.0015)),
        ),
      );
    };
    el.addEventListener('wheel', wheel, { passive: false });
    let frame = 0,
      frames = 0,
      start = performance.now(),
      last = 0;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (document.hidden) return;
      const t = 1 - Math.exp(-Math.min(0.05, (now - last) / 1000) * 12);
      last = now;
      const v = view.current,
        d = target.current;
      v.lon += (d.lon - v.lon) * t;
      v.lat += (d.lat - v.lat) * t;
      v.zoom = 1 / (1 / v.zoom + (1 / d.zoom - 1 / v.zoom) * t);
      world.current?.draw(current.current, v.lon, v.lat, v.zoom);
      frames++;
      if (now - start > 1500) {
        current.current.onFps(Math.round((frames * 1000) / (now - start)));
        frames = 0;
        start = now;
      }
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('wheel', wheel);
      world.current?.dispose();
      world.current = null;
    };
  }, []);
  return (
    <div className="globe-stage">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="3D Earth: drag to rotate, scroll to zoom, arrow keys to navigate. Satellite observations, relief, ocean, buildings and calculated tracers share a depth-tested scene."
        onPointerDown={(e) => {
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            startX: e.clientX,
            startY: e.clientY,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const k = 0.28 / Math.max(1, target.current.zoom);
          target.current.lon -= (e.clientX - d.x) * k;
          target.current.lat = Math.max(
            -85,
            Math.min(85, target.current.lat + (e.clientY - d.y) * k),
          );
          d.x = e.clientX;
          d.y = e.clientY;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (d && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5) {
            const r = e.currentTarget.getBoundingClientRect(),
              hit = world.current?.hit(e.clientX - r.left, e.clientY - r.top);
            if (typeof hit === 'number') props.onSite(hit);
            else if (hit) props.onInspect(hit);
          }
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            const k = 8 / Math.max(1, target.current.zoom);
            target.current.lon +=
              e.key === 'ArrowLeft' ? -k : e.key === 'ArrowRight' ? k : 0;
            target.current.lat = Math.max(
              -85,
              Math.min(
                85,
                target.current.lat +
                  (e.key === 'ArrowUp' ? k : e.key === 'ArrowDown' ? -k : 0),
              ),
            );
          }
          if (e.key === '+' || e.key === '=')
            target.current.zoom = Math.min(50000, target.current.zoom * 1.3);
          if (e.key === '-')
            target.current.zoom = Math.max(0.65, target.current.zoom / 1.3);
        }}
      />
      <div className="globe-tools">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          onClick={() => {
            target.current.zoom = Math.min(50000, target.current.zoom * 1.5);
          }}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          onClick={() => {
            target.current.zoom = Math.max(0.65, target.current.zoom / 1.5);
          }}
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset globe view"
          onClick={() => {
            props.onReset();
            target.current = { lon: -75.2, lat: 12, zoom: 1 };
          }}
        >
          <LocateFixed />
        </Button>
      </div>
      {error && <output className="map-error">{error}</output>}
    </div>
  );
}
