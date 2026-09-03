'use client';
import { useEffect, useRef, useState } from 'react';
import manifest from '@/public/data/imagery/manifest.json';

export { manifest as imageryManifest };

/** A separate, bounded observation clock. Never sends messages to the solver. */
export function useObservation() {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [cloudOnly, setCloudOnly] = useState(true);
  const [cloudHeightKm, setCloudHeightKm] = useState(6);
  const [cloudScale, setCloudScale] = useState(50);
  const [cloudThreshold, setCloudThreshold] = useState(0.5);
  const [displayed, setDisplayed] = useState<{
    image: HTMLImageElement;
    date: string;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle',
  );
  const cache = useRef(new Map<string, Promise<HTMLImageElement>>());

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const load = (path: string) => {
      if (!cache.current.has(path)) {
        const pending = new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          const timer = window.setTimeout(() => {
            image.src = '';
            reject(Error('Image timed out'));
          }, 20000);
          image.onload = () => {
            clearTimeout(timer);
            resolve(image);
          };
          image.onerror = () => {
            clearTimeout(timer);
            reject(Error('Image unavailable'));
          };
          image.src = path;
        });
        cache.current.set(path, pending);
        pending.catch(() => cache.current.delete(path));
      }
      return cache.current.get(path)!;
    };
    const frame = manifest.frames[index];
    load(frame.path)
      .then((image) => {
        if (cancelled) return;
        setDisplayed({ image, date: frame.date });
        setStatus('ready');
        // Only the next frame is prefetched. The fixed archive bounds the cache to six images.
        void load(
          manifest.frames[(index + 1) % manifest.frames.length].path,
        ).catch(() => {});
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        setPlaying(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, index]);

  useEffect(() => {
    if (!enabled || !playing || status !== 'ready') return;
    const interval = window.setInterval(() => {
      if (!document.hidden) {
        setStatus('loading');
        setIndex((value) => (value + 1) % manifest.frames.length);
      }
    }, 1400);
    return () => clearInterval(interval);
  }, [enabled, playing, status, index]);

  return {
    enabled,
    setEnabled: (value: boolean) => {
      if (value && !enabled) setStatus('loading');
      if (!value) setPlaying(false);
      setEnabled(value);
    },
    playing,
    setPlaying,
    index,
    setIndex: (value: number) => {
      if (value !== index) {
        setStatus('loading');
        setIndex(value);
      }
    },
    opacity,
    setOpacity,
    cloudOnly,
    setCloudOnly,
    cloudHeightKm,
    setCloudHeightKm,
    cloudScale,
    setCloudScale,
    cloudThreshold,
    setCloudThreshold,
    status,
    displayedDate: displayed?.date ?? null,
    image: enabled ? (displayed?.image ?? null) : null,
  };
}

export type Observation = ReturnType<typeof useObservation>;
