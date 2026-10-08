import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = 'https://cdn.star.nesdis.noaa.gov/GOES19/ABI/FD';
const directory = 'public/data/archive/goes';
const definitions = [
  {
    id: 'geocolor',
    label: 'GeoColor',
    folder: 'GEOCOLOR',
    kind: 'Day / night composite',
    summary:
      'Daylight colour transitions to infrared cloud imagery at night. A processed composite, not a single camera photograph.',
  },
  {
    id: 'airmass',
    label: 'Airmass RGB',
    folder: 'AirMass',
    kind: 'Multispectral RGB',
    summary:
      'Infrared band combinations reveal upper-atmosphere moisture and air-mass contrasts. Colour encodes atmospheric differences, not surface appearance.',
  },
  {
    id: 'sandwich',
    label: 'Sandwich RGB',
    folder: 'Sandwich',
    kind: 'Visible + infrared composite',
    summary:
      'Infrared band 13 combined with band 3 texture brings cloud-top temperature structure and detail into one image.',
  },
  {
    id: 'co2',
    label: 'CO₂ / band 16',
    folder: '16',
    kind: '13.3 µm infrared',
    summary:
      'A CO₂ absorption band sensitive to the atmosphere. This enhanced infrared display is not a map of CO₂ emissions or concentration.',
  },
  {
    id: 'winds',
    label: 'Derived motion winds',
    folder: 'DMW',
    kind: 'Retrieved winds over GeoColor',
    summary:
      'NOAA tracks features between satellite images to retrieve winds. The barbs are part of the supplied image, not independent vectors or this pilot’s tracer simulation.',
  },
];
function parseStamp(stamp) {
  const year = Number(stamp.slice(0, 4)),
    day = Number(stamp.slice(4, 7));
  return new Date(
    Date.UTC(
      year,
      0,
      day,
      Number(stamp.slice(7, 9)),
      Number(stamp.slice(9, 11)),
    ),
  ).toISOString();
}
function stampFromTime(time) {
  const date = new Date(time);
  const day =
    Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000) + 1;
  return (
    date.getUTCFullYear() +
    String(day).padStart(3, '0') +
    String(date.getUTCHours()).padStart(2, '0') +
    String(date.getUTCMinutes()).padStart(2, '0')
  );
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw Error(`HTTP ${response.status}: ${url}`);
  return response;
}
async function catalogue(product) {
  const html = await (await get(`${root}/${product.folder}/`)).text();
  const regex = /href="(\d{11}_GOES19-ABI-FD-[^"]+-1808x1808\.jpg)"/g;
  return [
    ...new Set([...html.matchAll(regex)].map((match) => match[1].slice(0, 11))),
  ].sort();
}
function jpegSize(bytes) {
  if (bytes[0] !== 255 || bytes[1] !== 216) throw Error('Not a JPEG');
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset++] !== 255) throw Error('Invalid JPEG segment');
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    const length = bytes.readUInt16BE(offset);
    if ([192, 193, 194].includes(marker))
      return {
        width: bytes.readUInt16BE(offset + 5),
        height: bytes.readUInt16BE(offset + 3),
      };
    if (length < 2) throw Error('Invalid JPEG length');
    offset += length;
  }
  throw Error('JPEG dimensions not found');
}
const catalogues = await Promise.all(definitions.map(catalogue));
const common = catalogues[0].filter((stamp) =>
  catalogues.slice(1, 4).every((list) => list.includes(stamp)),
);
const requestedEnd = process.argv
  .find((arg) => arg.startsWith('--end='))
  ?.slice(6);
let stamps;
for (const end of [...common].reverse()) {
  if (requestedEnd && end !== requestedEnd) continue;
  const time = Date.parse(parseStamp(end));
  const candidate = Array.from({ length: 12 }, (_, i) =>
    stampFromTime(time - (11 - i) * 600000),
  );
  if (candidate.every((stamp) => common.includes(stamp))) {
    stamps = candidate;
    break;
  }
}
if (!stamps)
  throw Error(
    'No common consecutive 12-frame window across the four products.',
  );
const windStamp = catalogues[4]
  .filter((stamp) => stamp <= stamps.at(-1))
  .at(-1);
if (!windStamp)
  throw Error('No dated wind product within the available archive.');
await fs.mkdir(directory, { recursive: true });
const products = [];
for (let index = 0; index < definitions.length; index++) {
  const product = definitions[index];
  const selected = index === 4 ? [windStamp] : stamps;
  const frames = [];
  // Limit concurrency to three downloads, keeping upstream load and memory bounded.
  for (let start = 0; start < selected.length; start += 3) {
    const batch = await Promise.all(
      selected.slice(start, start + 3).map(async (stamp) => {
        const name = `${stamp}_GOES19-ABI-FD-${product.folder}-1808x1808.jpg`;
        const url = `${root}/${product.folder}/${name}`;
        const file = `/data/archive/goes/${name}`;
        let bytes;
        try {
          bytes = await fs.readFile('public' + file);
        } catch {
          bytes = Buffer.from(await (await get(url)).arrayBuffer());
        }
        const dimensions = jpegSize(bytes);
        if (
          dimensions.width < 600 ||
          dimensions.width > 3000 ||
          dimensions.height < 600 ||
          dimensions.height > 3100
        )
          throw Error(
            `Unexpected full-disk dimensions: ${JSON.stringify(dimensions)}`,
          );
        await fs.writeFile('public' + file, bytes);
        return {
          time: parseStamp(stamp),
          file,
          url,
          ...dimensions,
          bytes: bytes.length,
          sha256: createHash('sha256').update(bytes).digest('hex'),
        };
      }),
    );
    frames.push(...batch);
  }
  products.push({
    ...product,
    source: `https://www.star.nesdis.noaa.gov/GOES/fulldisk_band.php?sat=G19&band=${product.folder}&length=12`,
    cadenceMinutes: index === 4 ? null : 10,
    frames,
  });
  console.log(`${product.label}: ${frames.length} frames`);
}
const manifest = {
  schemaVersion: 1,
  title: 'GOES-19 / ways of seeing the atmosphere',
  provider: 'NOAA / NESDIS / STAR',
  retrievedAt: new Date().toISOString(),
  start: parseStamp(stamps[0]),
  end: parseStamp(stamps.at(-1)),
  projection:
    'Native geostationary full-disk image; not an equirectangular texture.',
  processing:
    'Original NOAA JPEG bytes retained with image captions, coastlines, legends and logos. No recolouring, keying, reprojection, added illumination or synthetic vectors.',
  products,
};
await fs.writeFile(
  directory + '/manifest.json',
  JSON.stringify(manifest, null, 2),
);
console.log(
  `Archived ${manifest.start} to ${manifest.end}. Reproduce with --end=${stamps.at(-1)}.`,
);
