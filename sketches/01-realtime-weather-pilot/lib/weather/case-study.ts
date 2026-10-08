import archive from '@/public/data/popeye-archive.json';
import geography from '@/public/data/laos-geography.json';
import type { Contribution, WindGrid } from './types';
export { archive, geography };
export const historicalSource =
  'https://history.state.gov/historicaldocuments/frus1964-68v28/d274';
export const civilianSource =
  'https://laopdr.un.org/en/14539-unexploded-ordnance-obstacle-development';
export const popeye: Contribution = {
  schemaVersion: 1,
  id: 'popeye-1966',
  title: 'The ground as a weapon',
  author: 'Weather Commons · historical study 02',
  kind: 'gridded',
  description:
    'Project Popeye, the Lao panhandle and the conversion of rain into a military instrument. October 1966 / January 1967.',
  source: {
    title: 'ERA5 100 m wind · 1 October 1966, 00 UTC',
    url: 'https://open-meteo.com/en/docs/historical-weather-api',
    license:
      'ERA5 via Open-Meteo · attribution CC BY 4.0; Natural Earth public domain',
    note: 'A real reanalysis product, sampled from ERA5 via Open-Meteo on a 7×7 grid at 1° spacing. 100 m above-ground wind speed/direction converted to east/north components. The pilot freezes the 00 UTC field for its entire run, applies it over a smooth sphere and releases hypothetical tracers. This is not an aircraft flight, a reconstruction of a seeding mission or a rainfall-effect calculation. The archive establishes the month of testing, not this release date, point, altitude or size.',
  },
  parameters: {
    wind: 18,
    diffusion: 2000,
    lifetime: 120,
    latitude: 15.5,
    longitude: 107,
    seed: 42,
    releaseHeight: 100,
    verticalDiffusion: 0,
    releaseRadiusKm: 25,
  },
  grid: archive.grid as WindGrid,
  chapters: [
    {
      label: '01 / Archive',
      title: 'Rain enters the military plan.',
      text: 'A January 1967 memorandum records October 1966 tests in the Se Kong valley and proposes extending rain to obstruct transport. The document is evidence of intent and official claims; it does not independently establish effectiveness.',
      longitude: 107,
      latitude: 15.5,
      source: historicalSource,
    },
    {
      label: '02 / Architecture',
      title: 'A ford becomes a bottleneck.',
      text: 'The memorandum treats stream crossings, damaged bridges and roads as vulnerable infrastructure. It also anticipates risks to harvests and civilian movement. These are contemporary expectations, not measured outcomes in this visualization.',
      longitude: 106.59753,
      latitude: 17.483337,
      source: historicalSource,
    },
    {
      label: '03 / Inhabited ground',
      title: 'The war persists in the land.',
      text: 'UN reporting describes unexploded ordnance restricting agriculture and the construction of roads and schools in Laos. This is a documented legacy of bombing, distinct from the uncertain effects of weather modification.',
      longitude: 106.426999,
      latitude: 15.715998,
      source: civilianSource,
    },
    {
      label: '04 / Method',
      title: 'An archive is not a counterfactual.',
      text: 'Reanalysis estimates weather using observations and a numerical model. A wet day cannot, on its own, identify added rain from seeding. Our particle paths ask about sensitivity to an assumed field; they do not answer whether Popeye worked.',
      longitude: 107,
      latitude: 15.5,
      source: 'https://open-meteo.com/en/docs/historical-weather-api',
    },
  ],
};
function place(name: string) {
  const p = geography.places.find((p) => p.name === name);
  if (!p) throw Error('Missing settlement ' + name);
  return p;
}
export const caseSites = [
  {
    ...place('Saravan'),
    id: 'saravan',
    title: 'Saravan / inhabited land',
    role: 'Cultivate',
    label: 'SARAVAN',
    text: 'A mapped settlement provides a geographic anchor for reading the wider civilian landscape. The point comes from Natural Earth’s present-day gazetteer; it is not a survey of the town in 1966.',
    consequence:
      'UN reporting connects unexploded ordnance with constrained cultivation and infrastructure. No damage or exposure at this point is inferred from the plume.',
    source: civilianSource,
    detail: 'Settlement location · Natural Earth · contextual anchor',
  },
  {
    ...place('Đồng Hới'),
    id: 'dong-hoi',
    title: 'Đồng Hới / named in the archive',
    role: 'Inhabit',
    label: 'ĐỒNG HỚI',
    text: 'The 1967 memorandum explicitly names Đồng Hới when considering populated areas. Its treatment of civilian space can be read alongside the military objective of obstructing movement.',
    consequence:
      'A location in a planning document is not evidence of measured flooding or crop loss. The simulation contains no historical population or building inventory.',
    source: historicalSource,
    detail: 'Named place · planning document, paragraph 10',
  },
  {
    ...place('Pakxe'),
    id: 'pakxe',
    title: 'Pakxe / Mekong geography',
    role: 'Cross',
    label: 'PAKXE',
    text: 'A settlement beside the Mekong places the experiment in a connected river landscape. River geometry and settlement points are mapped references, not a hydrological network solved by the model.',
    consequence:
      'Airborne motion, runoff and settlement exposure require different models. The present tracer calculation cannot translate a path into a flood depth.',
    source:
      'https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/',
    detail: 'Settlement and river reference · Natural Earth',
  },
];
