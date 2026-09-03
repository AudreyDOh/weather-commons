'use client';
import { useEffect, useState } from 'react';
import { goesManifest, useGoesFrame } from './use-goes-frame';
import { useCloudHeight } from './use-cloud-height';
export function useSatellite() {
  const [enabled, setEnabled] = useState(true),
    [productId, setProductId] = useState('airmass'),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [opacity, setOpacity] = useState(0.92),
    [lift, setLift] = useState(0),
    [heightEnabled, setHeightEnabled] = useState(false),
    [heightScale, setHeightScale] = useState(50);
  const product = goesManifest.products.find((p) => p.id === productId)!;
  const view = useGoesFrame(enabled ? product : null, index);
  const height = useCloudHeight(heightEnabled, index);
  const ready = heightEnabled
    ? height.ready && !height.error
    : view.ready && !view.error;
  const frameCount = heightEnabled
    ? height.manifest.frames.length
    : product.frames.length;
  useEffect(() => {
    if ((!enabled && !heightEnabled) || !playing || !ready) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      if (index >= frameCount - 1) setPlaying(false);
      else setIndex((i) => i + 1);
    }, 650);
    return () => clearInterval(timer);
  }, [enabled, heightEnabled, playing, ready, index, frameCount]);
  return {
    enabled,
    setEnabled,
    product,
    productId,
    setProductId,
    index,
    setIndex,
    playing,
    setPlaying,
    opacity,
    setOpacity,
    lift,
    setLift,
    view,
    height,
    heightEnabled,
    setHeightEnabled,
    heightScale,
    setHeightScale,
    ready,
    frameCount,
    products: goesManifest.products,
  };
}
