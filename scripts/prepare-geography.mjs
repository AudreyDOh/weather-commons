import fs from 'node:fs/promises';

const sources = {
  places:
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places_simple.geojson',
  rivers:
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_rivers_lake_centerlines.geojson',
};

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw Error(`Could not retrieve ${url}: ${response.status}`);
  return response.json();
}

const [placeSource, riverSource] = await Promise.all([
  getJson(sources.places),
  getJson(sources.rivers),
]);
const places = placeSource.features.filter((feature) => {
  const [longitude, latitude] = feature.geometry.coordinates;
  return longitude >= 103 && longitude <= 109 && latitude >= 12 && latitude <= 19;
});
const rivers = riverSource.features.filter((feature) =>
  /Mekong|Kong|Sesan|Se San|Se Kong/i.test(feature.properties.name ?? ''),
);
const data = {
  sources,
  places: places.map((feature) => ({
    name: feature.properties.name,
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
  })),
  rivers: rivers.map((feature) => ({
    name: feature.properties.name,
    geometry: feature.geometry,
  })),
};

await fs.writeFile('public/data/laos-geography.json', JSON.stringify(data));
console.log({ places: data.places.length, rivers: data.rivers.map((river) => river.name) });
