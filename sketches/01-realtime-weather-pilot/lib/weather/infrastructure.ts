export const infrastructure = [
  {
    id: 'graciosa',
    title: 'Graciosa observatory',
    role: 'Observe',
    longitude: -28.0257,
    latitude: 39.0916,
    label: 'GRACIOSA',
    text: 'On an Atlantic island, cloud radars, lidar and radiometers measure a vertical column of atmosphere. A point on the map is a collection of instruments, maintenance work and decisions about what can be measured.',
    consequence:
      'A local column is not the whole ocean. Spatial gaps matter when observations are used to evaluate clouds in models.',
    source: 'https://www.arm.gov/capabilities/observatories/ena/locations/C1',
    detail: 'ARM · Eastern North Atlantic · established 2013',
  },
  {
    id: 'reading',
    title: 'ECMWF, Reading',
    role: 'Model',
    longitude: -0.95,
    latitude: 51.43,
    label: 'READING',
    text: 'Research and forecasting methods turn heterogeneous measurements into estimates of atmospheric state. The model is an institutional practice as well as a set of equations.',
    consequence:
      'Choices about resolution and assimilation shape what becomes visible in a forecast. This pilot does not ingest ECMWF observations or forecasts.',
    source: 'https://www.ecmwf.int/en/research/data-assimilation',
    detail: 'ECMWF · research and forecasting · approximate site location',
  },
  {
    id: 'bologna',
    title: 'ECMWF data centre',
    role: 'Compute',
    longitude: 11.35,
    latitude: 44.52,
    label: 'BOLOGNA',
    text: 'Operational forecasting moved to Bologna in October 2022. A former tobacco-factory site became part of the physical infrastructure of atmospheric prediction.',
    consequence:
      'A planetary forecast depends on buildings, power, cooling and international coordination. The line to Reading represents an institutional relationship, not a traced cable route.',
    source:
      'https://www.ecmwf.int/en/newsletter/177/news/one-year-operational-service-bologna',
    detail: 'ECMWF · Bologna · approximate site location',
  },
];
