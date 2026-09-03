/** Orthographic 3D projection with spherical occlusion. Altitude stays in metres. */
export function createProjection(
  longitude: number,
  latitude: number,
  radius: number,
  cx: number,
  cy: number,
  exaggeration = 1,
) {
  const deg = Math.PI / 180,
    clat = Math.cos(latitude * deg),
    slat = Math.sin(latitude * deg);
  return (lon: number, lat: number, height = 0) => {
    const a = (lon - longitude) * deg,
      t = lat * deg,
      c = Math.cos(t),
      depth = slat * Math.sin(t) + clat * c * Math.cos(a);
    const scale = 1 + (height * exaggeration) / 6371000;
    const px = radius * scale * c * Math.sin(a),
      py = -radius * scale * (clat * Math.sin(t) - slat * c * Math.cos(a));
    const visible = depth >= 0 || px * px + py * py > radius * radius;
    return {
      x: cx + px,
      y: cy + py,
      z: visible ? Math.max(0.03, Math.abs(depth)) : -1,
      depth,
    };
  };
}
