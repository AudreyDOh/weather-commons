import * as THREE from 'three';
import { earthPoint } from './earth-geometry';

export type CloudHeightFrame = {
  heights: Uint16Array;
  navigation: Float32Array;
  index: number;
};
export const CLOUD_PALETTE = [
  '#233c76',
  '#267fb7',
  '#44c7bd',
  '#d6eaa0',
  '#ffe078',
];

/** A quality-masked top surface, not a model of cloud density or cloud bases. */
export function cloudHeightGeometry(
  frame: CloudHeightFrame,
  scale: number,
  width = 543,
) {
  const { heights, navigation } = frame;
  const positions = new Float32Array(heights.length * 3);
  const colors = new Float32Array(positions.length);
  const palette = CLOUD_PALETTE.map((c) => new THREE.Color(c));
  for (let i = 0; i < heights.length; i++) {
    if (heights[i] === 65535) continue;
    earthPoint(
      navigation[i * 2],
      navigation[i * 2 + 1],
      heights[i] * scale,
    ).toArray(positions, i * 3);
    const value = Math.min(4, heights[i] / 5000),
      band = Math.min(3, Math.floor(value));
    palette[band]
      .clone()
      .lerp(palette[band + 1], value - band)
      .toArray(colors, i * 3);
  }
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number) => {
    const lo = Math.min(heights[a], heights[b], heights[c]),
      hi = Math.max(heights[a], heights[b], heights[c]);
    if (hi === 65535 || hi - lo > 2500) return;
    indices.push(a, b, c);
  };
  for (let j = 0; j < heights.length / width - 1; j++)
    for (let i = 0; i < width - 1; i++) {
      const a = j * width + i,
        b = a + width;
      triangle(a, b, a + 1);
      triangle(b, b + 1, a + 1);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}
