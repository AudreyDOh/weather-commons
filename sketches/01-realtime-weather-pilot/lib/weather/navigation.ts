export type CameraMode = 'Globe' | 'Map' | 'Orbit';
/** Unwind local heading continuously when returning to the north-up globe. */
export function cameraHeading(zoom: number, heading: number) {
  return smoothStep(1, 4, zoom) * heading;
}
export function cameraMode(zoom: number): CameraMode {
  return zoom < 4 ? 'Globe' : zoom < 300 ? 'Map' : 'Orbit';
}
export function smoothStep(a: number, b: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
/** Local tilt appears continuously. Source geometry is never tilted or rescaled. */
export function cameraTilt(zoom: number, tilt: number) {
  return (smoothStep(8, 300, zoom) * tilt * Math.PI) / 180;
}
export function panAnchor(
  lon: number,
  lat: number,
  dx: number,
  dy: number,
  zoom: number,
  heading: number,
) {
  const k = 0.28 / Math.max(1, zoom),
    a = (heading * Math.PI) / 180;
  const east = -dx * Math.cos(a) + dy * Math.sin(a),
    north = dx * Math.sin(a) + dy * Math.cos(a);
  return {
    lon: lon + (east * k) / Math.max(0.15, Math.cos((lat * Math.PI) / 180)),
    lat: Math.max(-85, Math.min(85, lat + north * k)),
  };
}
