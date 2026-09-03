'use client';
import { useEffect, useRef, useState } from 'react';
import { Minus, Plus, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyticWind, random, sampleGrid } from '@/lib/weather/simulation';
import { createProjection } from '@/lib/weather/projection';
import { createEarthSurface } from '@/lib/weather/earth-surface';
import { geography } from '@/lib/weather/case-study';
import type { infrastructure } from '@/lib/weather/infrastructure';
import type { Contribution, Snapshot } from '@/lib/weather/types';
type Props = {
  suspended: boolean;
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
  networkVisible: boolean;
  selectedSite: number | null;
  onSite: (index: number) => void;
};
type Geometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };
export default function Globe(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    current = useRef(props),
    view = useRef({ lon: -35, lat: 25, zoom: 1 }),
    target = useRef({ lon: -35, lat: 25 }),
    drag = useRef<{ x: number; y: number } | null>(null),
    zoom = useRef(1),
    hits = useRef<{ x: number; y: number; index: number }[]>([]),
    pointerStart = useRef({ x: 0, y: 0 });
  const [error, setError] = useState('');
  useEffect(() => {
    current.current = props;
  }, [props]);
  useEffect(() => {
    target.current = { lon: props.focus.longitude, lat: props.focus.latitude };
    if (props.focus.zoom !== undefined) zoom.current = props.focus.zoom;
  }, [props.focus.longitude, props.focus.latitude, props.focus.zoom]);
  useEffect(() => {
    const el = canvas.current!;
    const context = el.getContext('2d', { alpha: false });
    if (!context) {
      setError('Canvas is unavailable in this browser.');
      return;
    }
    const ctx: CanvasRenderingContext2D = context;
    let width = 0,
      height = 0,
      dpr = 1,
      frame = 0,
      alive = true,
      polygons: number[][][] = [],
      borders: number[][][] = [],
      baseDirty = true,
      lastView = '',
      fpsStart = performance.now(),
      frames = 0,
      lastFrame = 0;
    let surface: ReturnType<typeof createEarthSurface> = null;
    try {
      surface = createEarthSurface(
        () => {
          baseDirty = true;
        },
        () => setError('Detailed imagery unavailable. Showing coastline map.'),
      );
    } catch {
      queueMicrotask(() => {
        if (alive)
          setError('Detailed imagery unavailable. Showing coastline map.');
      });
    }
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.max(
        0.65,
        Math.min(
          12,
          zoom.current *
            Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.025 : 0.0015)),
        ),
      );
    };
    el.addEventListener('wheel', wheel, { passive: false });
    const base = document.createElement('canvas'),
      b = base.getContext('2d')!;
    fetch('/data/land.geojson')
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{ features: { geometry: Geometry }[] }>;
      })
      .then((data) => {
        if (!alive) return;
        polygons = data.features.flatMap((f: { geometry: Geometry }) =>
          f.geometry.type === 'Polygon'
            ? [f.geometry.coordinates[0]]
            : (f.geometry.coordinates as number[][][][]).map((p) => p[0]),
        );
        baseDirty = true;
      })
      .catch(() =>
        setError('Coastline unavailable; simulation remains active.'),
      );
    fetch('/data/boundaries.geojson')
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json() as Promise<{
          features: {
            geometry: { type: string; coordinates: number[][] | number[][][] };
          }[];
        }>;
      })
      .then((data) => {
        if (!alive) return;
        borders = data.features.flatMap((f) =>
          f.geometry.type === 'LineString'
            ? [f.geometry.coordinates as number[][]]
            : (f.geometry.coordinates as number[][][]),
        );
        baseDirty = true;
      })
      .catch(() => {
        if (alive)
          setError(
            'Country boundaries unavailable; simulation remains active.',
          );
      });
    const resize = () => {
      const rect = el.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      base.width = el.width;
      base.height = el.height;
      baseDirty = true;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const rand = random(873),
      flow = Array.from({ length: 1050 }, () => ({
        lon: rand() * 360 - 180,
        lat: rand() * 140 - 70,
        age: rand() * 100,
      }));
    function render(now: number) {
      if (!alive) return;
      frame = requestAnimationFrame(render);
      if (document.hidden || current.current.suspended) return;
      const delta = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
      lastFrame = now;
      const state = current.current;
      if (
        surface?.setCloudLayer(
          state.cloudOnly,
          state.cloudHeightKm,
          state.cloudScale,
          state.cloudThreshold,
          state.cloudSoftness,
        )
      )
        baseDirty = true;
      if (
        surface?.setObservation(
          state.observationImage,
          state.observationOpacity,
          state.observationPlaying,
        )
      )
        baseDirty = true;
      view.current.lon += (target.current.lon - view.current.lon) * 0.08;
      if (surface?.isTransitioning()) baseDirty = true;
      view.current.lat += (target.current.lat - view.current.lat) * 0.08;
      view.current.zoom += (zoom.current - view.current.zoom) * 0.1;
      const { lon, lat } = view.current,
        r = Math.min(width * 0.48, height * 0.445) * view.current.zoom,
        cx = width * 0.5,
        cy = height * 0.5,
        project = createProjection(lon, lat, r, cx, cy, state.depthScale);
      const key = [
        lon.toFixed(2),
        lat.toFixed(2),
        r.toFixed(2),
        state.gridVisible,
        polygons.length,
        borders.length,
        state.coastVisible,
        state.bordersVisible,
        state.caseGeography,
      ].join('/');
      if (key !== lastView) baseDirty = true;
      lastView = key;
      if (baseDirty) {
        b.setTransform(dpr, 0, 0, dpr, 0, 0);
        b.fillStyle = '#060606';
        b.fillRect(0, 0, width, height);
        const halo = b.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.2);
        halo.addColorStop(0, 'rgba(90,134,143,.11)');
        halo.addColorStop(0.65, 'rgba(90,134,143,.025)');
        halo.addColorStop(1, 'rgba(90,134,143,0)');
        b.fillStyle = halo;
        b.fillRect(0, 0, width, height);
        b.beginPath();
        b.arc(cx, cy, r, 0, Math.PI * 2);
        const ocean = b.createRadialGradient(
          cx - r * 0.35,
          cy - r * 0.4,
          0,
          cx,
          cy,
          r,
        );
        ocean.addColorStop(0, '#1a2d35');
        ocean.addColorStop(0.7, '#102028');
        ocean.addColorStop(1, '#091218');
        b.fillStyle = ocean;
        b.fill();
        b.strokeStyle = '#4a626944';
        b.lineWidth = 1;
        b.stroke();
        // Draw the full GPU frame before the ground clip, so the cloud shell can extend above the limb.
        const earth = surface?.draw(base.width, base.height, lon, lat, r * dpr);
        if (earth) b.drawImage(earth, 0, 0, width, height);
        b.save();
        b.beginPath();
        b.arc(cx, cy, r - 0.5, 0, Math.PI * 2);
        b.clip();
        if (state.gridVisible) {
          b.strokeStyle = '#69818a21';
          b.lineWidth = 0.65;
          const line = (coords: number[][]) => {
            b.beginPath();
            let pen = false;
            for (const a of coords) {
              const p = project(a[0], a[1]);
              if (p.z > 0) {
                if (!pen) b.moveTo(p.x, p.y);
                else b.lineTo(p.x, p.y);
                pen = true;
              } else pen = false;
            }
            b.stroke();
          };
          for (let la = -75; la <= 75; la += 15)
            line(Array.from({ length: 181 }, (_, i) => [i * 2 - 180, la]));
          for (let lo = -180; lo < 180; lo += 15)
            line(Array.from({ length: 91 }, (_, i) => [lo, i * 2 - 90]));
        }
        if (!earth || state.coastVisible)
          for (const ring of polygons) {
            b.beginPath();
            let pen = false;
            for (const a of ring) {
              const p = project(a[0], a[1]);
              if (p.z > 0) {
                if (!pen) b.moveTo(p.x, p.y);
                else b.lineTo(p.x, p.y);
                pen = true;
              } else pen = false;
            }
            b.strokeStyle = '#dddddd65';
            b.lineWidth = 0.8;
            b.stroke();
          }
        if (state.bordersVisible) {
          b.strokeStyle = '#ffffff65';
          b.lineWidth = 0.65;
          for (const line of borders) {
            b.beginPath();
            let pen = false;
            for (const a of line) {
              const p = project(a[0], a[1]);
              if (p.z > 0) {
                if (pen) b.lineTo(p.x, p.y);
                else b.moveTo(p.x, p.y);
                pen = true;
              } else pen = false;
            }
            b.stroke();
          }
        }
        if (state.caseGeography) {
          b.strokeStyle = '#dddddd75';
          b.lineWidth = 0.8;
          for (const river of geography.rivers) {
            const paths =
              river.geometry.type === 'LineString'
                ? [river.geometry.coordinates]
                : river.geometry.coordinates;
            for (const path of paths as number[][][]) {
              b.beginPath();
              let pen = false;
              for (const a of path) {
                const p = project(a[0], a[1]);
                if (p.z > 0) {
                  if (pen) b.lineTo(p.x, p.y);
                  else b.moveTo(p.x, p.y);
                  pen = true;
                } else pen = false;
              }
              b.stroke();
            }
          }
          b.fillStyle = '#ddd9';
          for (const place of geography.places) {
            const p = project(place.longitude, place.latitude);
            if (p.z > 0) b.fillRect(p.x - 1, p.y - 1, 2, 2);
          }
        }
        // A stippled geographic surface uses the actual polygon coordinates.
        b.fillStyle = '#90a8ac80';
        if (!earth)
          for (const ring of polygons)
            for (let i = 0; i < ring.length; i += 3) {
              const p = project(ring[i][0], ring[i][1]);
              if (p.z > 0.05) b.fillRect(p.x, p.y, 0.8, 0.8);
            }
        const shade = b.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
        shade.addColorStop(0, 'rgba(120,156,157,.035)');
        shade.addColorStop(0.7, 'rgba(0,0,0,0)');
        shade.addColorStop(1, 'rgba(0,0,0,.5)');
        b.fillStyle = shade;
        b.fillRect(cx - r, cy - r, r * 2, r * 2);
        b.restore();
        baseDirty = false;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (state.atmosphereVisible && state.depthScale > 1) {
        ctx.strokeStyle = '#ffffff16';
        ctx.lineWidth = 0.6;
        ctx.setLineDash([2, 7]);
        for (const latitude of [-30, 0, 30, 60]) {
          ctx.beginPath();
          let pen = false;
          for (let lo = -180; lo <= 180; lo += 2) {
            const p = project(lo, latitude, 12000);
            if (p.z > 0) {
              if (pen) ctx.lineTo(p.x, p.y);
              else ctx.moveTo(p.x, p.y);
              pen = true;
            } else pen = false;
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      if (state.samplesVisible && state.contribution.grid) {
        const g = state.contribution.grid;
        ctx.strokeStyle = '#ededed85';
        ctx.fillStyle = '#edededaa';
        ctx.lineWidth = 0.8;
        for (let j = 0; j < g.height; j++)
          for (let i = 0; i < g.width; i++) {
            const lon = g.west + i * g.dx,
              lat = g.south + j * g.dy,
              p = project(lon, lat);
            if (p.z < 0) continue;
            const n = j * g.width + i,
              q = project(lon + g.u[n] * 0.035, lat + g.v[n] * 0.035);
            ctx.strokeRect(p.x - 2, p.y - 2, 4, 4);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
      }
      // Reference tethers locate elevated particles on the surface; they are not deposition.
      if (state.snapshot?.heights && state.depthScale > 1) {
        ctx.strokeStyle = '#ffffff25';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        for (let i = 0; i < state.snapshot.heights.length; i += 240) {
          if (!state.snapshot.positions[i * 3 + 2]) continue;
          const ground = project(
            state.snapshot.positions[i * 3],
            state.snapshot.positions[i * 3 + 1],
          );
          const air = project(
            state.snapshot.positions[i * 3],
            state.snapshot.positions[i * 3 + 1],
            state.snapshot.heights[i],
          );
          if (ground.z > 0 && air.z > 0) {
            ctx.moveTo(ground.x, ground.y);
            ctx.lineTo(air.x, air.y);
          }
        }
        ctx.stroke();
      }
      if (state.windVisible) {
        ctx.lineWidth = 0.7;
        ctx.strokeStyle = '#90b8bc66';
        ctx.beginPath();
        for (const f of flow) {
          const uv =
            state.contribution.kind === 'gridded' && state.contribution.grid
              ? sampleGrid(state.contribution.grid, f.lon, f.lat)
              : analyticWind(f.lon, f.lat, state.contribution.parameters);
          if (!uv) continue;
          if (state.contribution.kind === 'gridded') {
            uv[0] *= state.contribution.parameters.wind / 18;
            uv[1] *= state.contribution.parameters.wind / 18;
          }
          const a = project(
              f.lon,
              f.lat,
              state.contribution.parameters.releaseHeight ?? 0,
            ),
            nextLon = f.lon + uv[0] * 0.028,
            nextLat = f.lat + uv[1] * 0.024,
            p = project(
              nextLon,
              nextLat,
              state.contribution.parameters.releaseHeight ?? 0,
            );
          if (a.z > 0.04 && p.z > 0.04) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(p.x, p.y);
          }
          f.lon += uv[0] * delta * 0.08;
          f.lat += uv[1] * delta * 0.08;
          f.age += delta * 10;
          if (f.age > 100 || Math.abs(f.lat) > 78 || Math.abs(f.lon) > 180) {
            f.lon = rand() * 360 - 180;
            f.lat = rand() * 140 - 70;
            f.age = 0;
          }
        }
        ctx.stroke();
      }
      const drawParticles = (
        positions: Float32Array,
        color: string,
        alpha: number,
        size: number,
        heights?: Float32Array,
      ) => {
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        for (let i = 0; i < positions.length; i += 3) {
          if (!positions[i + 2]) continue;
          const p = project(
            positions[i],
            positions[i + 1],
            heights?.[i / 3] ?? 0,
          );
          if (p.z > 0) ctx.fillRect(p.x, p.y, size, size);
        }
        ctx.globalAlpha = 1;
      };
      if (state.snapshot?.trails) {
        const tracks = state.snapshot.trails,
          stride = 120;
        ctx.strokeStyle = '#e9e9e945';
        ctx.lineWidth = 0.75;
        ctx.beginPath();
        for (let k = 0; k < stride; k += 2) {
          let pen = false;
          for (let n = k; n < tracks.length; n += stride) {
            const pt = project(
              tracks[n],
              tracks[n + 1],
              state.snapshot?.trailHeights?.[n / 2] ?? 0,
            );
            if (pt.z > 0.02) {
              if (pen) ctx.lineTo(pt.x, pt.y);
              else ctx.moveTo(pt.x, pt.y);
              pen = true;
            } else pen = false;
          }
        }
        ctx.stroke();
      }
      if (state.baseline)
        drawParticles(
          state.baseline.positions,
          '#9cd5dc',
          0.35,
          1.25,
          state.baseline.heights,
        );
      if (state.snapshot) {
        drawParticles(
          state.snapshot.positions,
          '#eeeeee',
          0.08,
          4,
          state.snapshot.heights,
        );
        drawParticles(
          state.snapshot.positions,
          '#ffffff',
          0.85,
          1.65,
          state.snapshot.heights,
        );
      }
      const source = project(
        state.contribution.parameters.longitude,
        state.contribution.parameters.latitude,
      );
      const releaseAir = project(
        state.contribution.parameters.longitude,
        state.contribution.parameters.latitude,
        state.contribution.parameters.releaseHeight ?? 0,
      );
      if (source.z > 0 && releaseAir.z > 0) {
        ctx.strokeStyle = '#ffffff88';
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(releaseAir.x, releaseAir.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(releaseAir.x, releaseAir.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (source.z > 0) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(source.x, source.y, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(source.x, source.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff40';
        ctx.stroke();
      }
      if (state.placesVisible && !state.networkVisible) {
        const labels: { x: number; y: number; w: number }[] = [];
        ctx.font =
          '12px "Franklin Gothic Medium", "Libre Franklin", Arial, sans-serif';
        ctx.letterSpacing = '1px';
        for (const s of state.contribution.chapters) {
          const p = project(s.longitude, s.latitude);
          if (p.z > 0.25) {
            ctx.fillStyle = '#c1d0d0';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
            const label = s.label.split('/')[1]?.trim() || s.label,
              w = ctx.measureText(label).width + 10,
              rect = { x: p.x + 9, y: p.y - 17, w };
            if (
              !labels.some(
                (a) =>
                  rect.x < a.x + a.w &&
                  rect.x + rect.w > a.x &&
                  Math.abs(rect.y - a.y) < 16,
              )
            ) {
              ctx.fillText(label, p.x + 9, p.y - 7);
              labels.push(rect);
            }
          }
        }
      }
      hits.current = [];
      if (state.networkVisible) {
        for (const [startIndex, endIndex] of state.connections) {
          const a = state.sites[startIndex],
            end = state.sites[endIndex];
          if (!a || !end) continue;
          ctx.strokeStyle = '#d6d6d650';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.beginPath();
          let pen = false;
          for (let t = 0; t <= 1.001; t += 0.025) {
            const p = project(
              a.longitude + (end.longitude - a.longitude) * t,
              a.latitude + (end.latitude - a.latitude) * t,
            );
            if (p.z > 0) {
              if (pen) ctx.lineTo(p.x, p.y);
              else ctx.moveTo(p.x, p.y);
              pen = true;
            } else pen = false;
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }
        const labelPositions: { x: number; y: number }[] = [];
        state.sites.forEach((n, index) => {
          const p = project(n.longitude, n.latitude);
          if (p.z < 0.1 || p.x < 0 || p.x > width || p.y < 0 || p.y > height)
            return;
          let lift = index === 1 ? 62 : index === 2 ? 28 : 42;
          while (
            labelPositions.some(
              (a) =>
                Math.abs(a.x - p.x) < 140 && Math.abs(a.y - (p.y - lift)) < 24,
            )
          )
            lift += 24;
          labelPositions.push({ x: p.x, y: p.y - lift });
          ctx.strokeStyle = state.selectedSite === index ? '#fff' : '#ffffff80';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y - lift);
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
          ctx.strokeRect(p.x - 4, p.y - lift - 4, 8, 8);
          ctx.font =
            '12px "Franklin Gothic Medium", "Libre Franklin", Arial, sans-serif';
          ctx.letterSpacing = '0px';
          const label = n.label;
          const w = ctx.measureText(label).width;
          ctx.fillStyle = '#08080899';
          ctx.fillRect(p.x + 8, p.y - lift - 10, w + 12, 20);
          ctx.fillStyle = '#dcdcdc';
          ctx.fillText(label, p.x + 14, p.y - lift + 4);
          hits.current.push({ x: p.x, y: p.y - lift, index });
        });
      }
      ctx.font =
        '12px "Franklin Gothic Medium", "Libre Franklin", Arial, sans-serif';
      ctx.fillStyle = '#64777c';
      ctx.textAlign = 'center';
      ctx.fillText('N', cx, cy - r - 15);
      ctx.textAlign = 'left';
      frames++;
      if (now - fpsStart > 1200) {
        state.onFps(Math.round((frames * 1000) / (now - fpsStart)));
        frames = 0;
        fpsStart = now;
      }
    }
    frame = requestAnimationFrame(render);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      el.removeEventListener('wheel', wheel);
      surface?.dispose();
    };
  }, []);
  return (
    <div className="globe-stage">
      <canvas
        ref={canvas}
        aria-label="Interactive globe with calculated atmospheric tracer positions. Drag to rotate; scroll to zoom up to 12 times; use arrow keys to navigate. Infrastructure sites are also available in the Infrastructure panel."
        tabIndex={0}
        onPointerDown={(e) => {
          pointerStart.current = { x: e.clientX, y: e.clientY };
          drag.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          target.current.lon -=
            ((e.clientX - drag.current.x) * 0.28) / zoom.current;
          target.current.lat = Math.max(
            -75,
            Math.min(
              75,
              target.current.lat +
                ((e.clientY - drag.current.y) * 0.25) / zoom.current,
            ),
          );
          drag.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          drag.current = null;
          if (
            Math.hypot(
              e.clientX - pointerStart.current.x,
              e.clientY - pointerStart.current.y,
            ) < 5
          ) {
            const rect = e.currentTarget.getBoundingClientRect();
            const hit = hits.current.find(
              (p) =>
                Math.abs(e.clientX - rect.left - p.x) < 130 &&
                e.clientX - rect.left > p.x - 12 &&
                Math.abs(e.clientY - rect.top - p.y) < 18,
            );
            if (hit) current.current.onSite(hit.index);
          }
        }}
        onPointerCancel={() => (drag.current = null)}
        onKeyDown={(e) => {
          if (
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
          ) {
            e.preventDefault();
            target.current.lon +=
              e.key === 'ArrowLeft' ? -8 : e.key === 'ArrowRight' ? 8 : 0;
            target.current.lat = Math.max(
              -75,
              Math.min(
                75,
                target.current.lat +
                  (e.key === 'ArrowUp' ? 8 : e.key === 'ArrowDown' ? -8 : 0),
              ),
            );
          }
        }}
      />
      <div className="globe-tools">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          onClick={() => (zoom.current = Math.min(12, zoom.current * 1.3))}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          onClick={() => (zoom.current = Math.max(0.65, zoom.current / 1.3))}
        >
          <Minus />
        </Button>
        <span />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset globe view"
          onClick={() => {
            target.current = { lon: -35, lat: 25 };
            zoom.current = 1;
          }}
        >
          <LocateFixed />
        </Button>
      </div>
      {error && <div className="map-error">{error}</div>}
    </div>
  );
}
