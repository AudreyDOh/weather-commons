import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

// A fixed teaching archive, not a request for current weather.
const dates = [
  '2024-09-24',
  '2024-09-25',
  '2024-09-26',
  '2024-09-27',
  '2024-09-28',
  '2024-09-29',
];
const layer = 'MODIS_Terra_CorrectedReflectance_TrueColor';
const directory = 'public/data/imagery';
await fs.mkdir(directory, { recursive: true });
const frames = [];
for (const date of dates) {
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: '1.1.1',
    REQUEST: 'GetMap',
    LAYERS: layer,
    STYLES: '',
    SRS: 'EPSG:4326',
    BBOX: '-180,-90,180,90',
    WIDTH: '2048',
    HEIGHT: '1024',
    FORMAT: 'image/png',
    TRANSPARENT: 'TRUE',
    TIME: date,
  });
  const url =
    'https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?' + params;
  const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw Error(`Imagery ${date}: HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (
    bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' ||
    bytes.readUInt32BE(16) !== 2048 ||
    bytes.readUInt32BE(20) !== 1024
  )
    throw Error(`Invalid PNG for ${date}`);
  await fs.writeFile(`${directory}/${date}.png`, bytes);
  frames.push({
    date,
    path: `/data/imagery/${date}.png`,
    url,
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
  console.log(`${date}: ${Math.round(bytes.length / 1024)} KB`);
}
await fs.writeFile(
  `${directory}/manifest.json`,
  JSON.stringify(
    {
      title: 'Terra / MODIS — daily corrected reflectance',
      provider: 'NASA Global Imagery Browse Services (GIBS)',
      source: 'https://nasa-gibs.github.io/gibs-api-docs/python-usage/',
      layer,
      retrievedAt: new Date().toISOString(),
      width: 2048,
      height: 1024,
      bounds: [-180, -90, 180, 90],
      crs: 'EPSG:4326',
      note: 'Daily mosaics of satellite passes, not simultaneous global snapshots. Ground and clouds are combined. Transparent areas are missing coverage, not clear sky. The browser applies monochrome display shading; no cloud heights are inferred.',
      frames,
    },
    null,
    2,
  ),
);
