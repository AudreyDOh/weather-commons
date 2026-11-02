'use client';
import { useEffect, useRef, useState } from 'react';
import manifest from '@/public/data/archive/cloud-height/manifest.json';
import type { CloudHeightFrame } from './cloud-height';
import { publicUrl } from './public-url';

export const cloudHeightManifest = manifest;
async function binary(url: string) {
  const response = await fetch(publicUrl(url));
  if (!response.ok) throw Error('Cloud height archive unavailable');
  return response.arrayBuffer();
}
export function useCloudHeight(enabled: boolean, index: number) {
  const cache = useRef(new Map<number, Uint16Array>());
  const navigation = useRef<Promise<Float32Array> | null>(null);
  const [loaded, setLoaded] = useState<CloudHeightFrame | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    navigation.current ??= binary(manifest.navigation.file).then(
      (b) => new Float32Array(b),
    );
    Promise.all([
      navigation.current,
      cache.current.has(index)
        ? Promise.resolve(cache.current.get(index)!)
        : binary(manifest.frames[index].file).then((b) => new Uint16Array(b)),
    ])
      .then(([nav, heights]) => {
        if (cancelled) return;
        if (
          heights.length !== manifest.width * manifest.height ||
          nav.length !== heights.length * 2
        )
          throw Error('Invalid cloud height grid');
        cache.current.delete(index);
        cache.current.set(index, heights);
        while (cache.current.size > 4)
          cache.current.delete(cache.current.keys().next().value!);
        setLoaded({ heights, navigation: nav, index });
        setError('');
      })
      .catch(() => {
        if (!cancelled) {
          navigation.current = null;
          setError(
            'Cloud-top heights unavailable. The previous frame remains visible.',
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, index]);
  return { loaded, ready: loaded?.index === index, error, manifest };
}
