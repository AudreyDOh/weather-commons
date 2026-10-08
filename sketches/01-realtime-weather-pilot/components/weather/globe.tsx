'use client';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createEarthScene } from '@/lib/weather/earth-scene';
import type { infrastructure } from '@/lib/weather/infrastructure';
import type { Contribution, Snapshot } from '@/lib/weather/types';
import type { CloudHeightFrame } from '@/lib/weather/cloud-height';
import type { EarthInspection } from '@/lib/weather/earth-inspection';
import { cameraMode, cameraHeading, panAnchor } from '@/lib/weather/navigation';
import type { TerrainStatus } from '@/lib/weather/terrain-catalog';

export type GlobeProps = {
  detailEnabled: boolean;
  onTerrainStatus: (value: TerrainStatus) => void;
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
  const orbit = useRef({ heading: 0, tilt: 35 }),
    displayedOrbit = useRef({ heading: 0, tilt: 35 });
  const pointers = useRef(new Map<number, { x: number; y: number }>()),
    pinch = useRef<{ distance: number; x: number; y: number } | null>(null);
  const [mode, setMode] = useState<'Globe' | 'Map' | 'Orbit'>('Globe');
  const [panMode, setPanMode] = useState(false);
  const modeRef = useRef(mode);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    orbit.current = { heading: 0, tilt: 35 };
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
      displayedOrbit.current.heading +=
        (orbit.current.heading - displayedOrbit.current.heading) * t;
      displayedOrbit.current.tilt +=
        (orbit.current.tilt - displayedOrbit.current.tilt) * t;
      const nextMode = cameraMode(v.zoom);
      if (nextMode !== modeRef.current) {
        modeRef.current = nextMode;
        setMode(nextMode);
      }
      world.current?.draw(
        current.current,
        v.lon,
        v.lat,
        v.zoom,
        displayedOrbit.current.heading,
        displayedOrbit.current.tilt,
      );
      frames++;
      if (now - start > 1500) {
        current.current.onFps(Math.round((frames * 1000) / (now - start)));
        frames = 0;
        start = now;
      }
    };
    frame = requestAnimationFrame(render);
    return () => {
      if (clickTimer.current) clearTimeout(clickTimer.current);
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
        aria-label="3D Earth: drag to rotate the globe, pan the regional map or orbit close terrain. Shift-drag swaps pan and orbit. Scroll or pinch to zoom; double-click to approach a location. Arrow keys pan; Shift-arrow keys orbit."
        onContextMenu={(e) => e.preventDefault()}
        onDoubleClick={(e) => {
          if (clickTimer.current) clearTimeout(clickTimer.current);
          const r = e.currentTarget.getBoundingClientRect(),
            hit = world.current?.hit(e.clientX - r.left, e.clientY - r.top);
          if (hit && typeof hit !== 'number') {
            target.current.lon = hit.longitude;
            target.current.lat = hit.latitude;
            target.current.zoom = Math.min(
              50000,
              Math.max(5, target.current.zoom * 3),
            );
          }
        }}
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = {
              distance: Math.hypot(a.x - b.x, a.y - b.y),
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
            };
            drag.current = null;
            e.currentTarget.setPointerCapture(e.pointerId);
            return;
          }
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            startX: e.clientX,
            startY: e.clientY,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (pointers.current.size === 2 && pinch.current) {
            const [a, b] = [...pointers.current.values()],
              distance = Math.hypot(a.x - b.x, a.y - b.y),
              x = (a.x + b.x) / 2,
              y = (a.y + b.y) / 2,
              last = pinch.current;
            target.current.zoom = Math.max(
              0.65,
              Math.min(
                50000,
                (target.current.zoom * distance) / Math.max(1, last.distance),
              ),
            );
            Object.assign(
              target.current,
              panAnchor(
                target.current.lon,
                target.current.lat,
                x - last.x,
                y - last.y,
                target.current.zoom,
                cameraHeading(target.current.zoom, orbit.current.heading),
              ),
            );
            pinch.current = { distance, x, y };
            return;
          }
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x,
            dy = e.clientY - d.y;
          const closeOrbit =
            cameraMode(target.current.zoom) === 'Orbit' && !panMode;
          const rotate =
            target.current.zoom >= 4 &&
            (e.shiftKey || e.buttons === 2 ? !closeOrbit : closeOrbit);
          if (rotate) {
            orbit.current.heading -= dx * 0.3;
            orbit.current.tilt = Math.max(
              0,
              Math.min(75, orbit.current.tilt + dy * 0.25),
            );
          } else
            Object.assign(
              target.current,
              panAnchor(
                target.current.lon,
                target.current.lat,
                dx,
                dy,
                target.current.zoom,
                cameraHeading(target.current.zoom, orbit.current.heading),
              ),
            );
          d.x = e.clientX;
          d.y = e.clientY;
        }}
        onPointerUp={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          const d = drag.current;
          if (
            d &&
            e.button === 0 &&
            Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 5
          ) {
            const r = e.currentTarget.getBoundingClientRect(),
              hit = world.current?.hit(e.clientX - r.left, e.clientY - r.top);
            if (clickTimer.current) clearTimeout(clickTimer.current);
            clickTimer.current = setTimeout(() => {
              if (typeof hit === 'number') current.current.onSite(hit);
              else if (hit) current.current.onInspect(hit);
            }, 240);
          }
          drag.current = null;
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          drag.current = null;
        }}
        onLostPointerCapture={(e) => {
          pointers.current.delete(e.pointerId);
          pinch.current = null;
          drag.current = null;
        }}
        onKeyDown={(e) => {
          if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            if (e.shiftKey && target.current.zoom >= 4) {
              orbit.current.heading +=
                e.key === 'ArrowLeft' ? -8 : e.key === 'ArrowRight' ? 8 : 0;
              orbit.current.tilt = Math.max(
                0,
                Math.min(
                  75,
                  orbit.current.tilt +
                    (e.key === 'ArrowUp' ? -5 : e.key === 'ArrowDown' ? 5 : 0),
                ),
              );
              return;
            }
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
      <div className="navigation-hint">
        <span>
          {mode} /{' '}
          {mode === 'Globe'
            ? 'Drag to rotate'
            : mode === 'Map'
              ? 'Drag to pan'
              : panMode
                ? 'Drag to pan'
                : 'Drag to orbit'}
        </span>
        <span>
          Scroll / pinch to zoom
          {mode !== 'Globe'
            ? ' · Shift-drag to ' +
              (mode === 'Map' || panMode ? 'orbit' : 'pan')
            : ''}
        </span>
        {mode === 'Orbit' && (
          <button aria-pressed={panMode} onClick={() => setPanMode(!panMode)}>
            {panMode ? 'Use orbit' : 'Use pan'}
          </button>
        )}
      </div>
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
