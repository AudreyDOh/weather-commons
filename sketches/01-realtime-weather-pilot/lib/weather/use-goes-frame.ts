'use client';
import { useEffect, useRef, useState } from 'react';
import manifest from '@/public/data/archive/goes/manifest.json';
import { publicUrl } from './public-url';

export { manifest as goesManifest };
export type GoesProduct = (typeof manifest.products)[number];
export type GoesFrame = GoesProduct['frames'][number];
type Loaded = {
  product: GoesProduct;
  frame: GoesFrame;
  image: HTMLImageElement;
};

/** Four decoded frames per view; only the selected frame and its successor are requested. */
export function useGoesFrame(product: GoesProduct | null, index: number) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failed, setFailed] = useState('');
  const cache = useRef(new Map<string, Promise<HTMLImageElement>>());
  const selected = product?.frames[Math.min(index, product.frames.length - 1)];
  useEffect(() => {
    if (!product || !selected) return;
    let cancelled = false;
    const load = (path: string) => {
      const existing = cache.current.get(path);
      if (existing) {
        cache.current.delete(path);
        cache.current.set(path, existing);
        return existing;
      }
      const request = new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const timeout = window.setTimeout(
          () => reject(Error('Image timed out')),
          20000,
        );
        image.onload = () => {
          clearTimeout(timeout);
          resolve(image);
        };
        image.onerror = () => {
          clearTimeout(timeout);
          reject(Error('Image unavailable'));
        };
        image.src = publicUrl(path);
      });
      cache.current.set(path, request);
      request.catch(() => cache.current.delete(path));
      while (cache.current.size > 4)
        cache.current.delete(cache.current.keys().next().value!);
      return request;
    };
    load(selected.file)
      .then((image) => {
        if (cancelled) return;
        setLoaded({ product, frame: selected, image });
        setFailed('');
        const next = product.frames[index + 1];
        if (next) void load(next.file).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setFailed(selected.file);
      });
    return () => {
      cancelled = true;
    };
  }, [product, selected, index]);
  return {
    loaded,
    ready: Boolean(selected && loaded?.frame.file === selected.file),
    error: Boolean(selected && failed === selected.file),
  };
}
