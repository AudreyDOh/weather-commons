'use client';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const datasets = [
  {
    title: 'USGS 3DEP + NAIP / regional 3D Tiles',
    kind: 'Modelled elevation + observed aerial mosaic',
    detail:
      'Mount Rainier sample. Four geometry/image levels load on approach. Archived elevation export: about 60 m sample spacing; aerial mosaic: about 8 m pixels. Regional coverage only.',
    meaning:
      'Bare-earth terrain is placed on a reference sphere at 1× height. Geometric refinement adds archived source detail, never new measurements. Tile-edge skirts hide display seams. Source elevation datums and acquisition records are retained in the catalogue; dates are not synchronized with weather layers.',
    source:
      'https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer',
    archive: '/data/archive/rainier/manifest.json',
  },
  {
    title: 'GOES-19 / spectral imagery',
    kind: 'Observed · processed composite',
    detail:
      '03 Sep 2026, 04:10–06:00 UTC. Twelve ten-minute frames of GeoColor, Air Mass, Sandwich RGB and CO₂ band 16; a separate derived-motion-wind image.',
    meaning:
      'Different channels reveal different atmospheric properties. RGB colours encode channel combinations, not a cloud-height scale. JPEGs are approximately registered on the globe; map lines and wind barbs in the source remain part of the image.',
    source: 'https://www.star.nesdis.noaa.gov/goes/fulldisk.php?sat=G19',
    archive: '/data/archive/goes/manifest.json',
  },
  {
    title: 'ABI ACHA / cloud-top height',
    kind: 'Retrieved · algorithm + satellite',
    detail:
      'Same twelve scan windows. Native 10 km at nadir; displayed every second sample, about 20 km at nadir. Heights in metres. Good-quality DQF = 0 only.',
    meaning:
      'Infrared observations and an algorithm estimate cloud-top geopotential height. The mesh interpolates neighbouring valid samples, with gaps at missing values and height jumps above 2.5 km. Height is placed radially on a reference sphere; parallax is not corrected. This is a top surface, not a cloud volume.',
    source:
      'https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC01505',
    archive: '/data/archive/cloud-height/manifest.json',
  },
  {
    title: 'NOAA ETOPO1 / land + seafloor',
    kind: 'Modelled · relief compilation',
    detail:
      '2009 global relief model, ice-surface version. Display archive: 2048 × 1024, bilinearly resampled to signed integer metres; roughly 20 km at the equator.',
    meaning:
      'Positive elevation rises above sea level; negative elevation descends below it. This overview cannot resolve streets or local flood pathways. The blue bathymetric shading and lighting are interpretive. Vertical exaggeration changes the display, not source values.',
    source:
      'https://www.ncei.noaa.gov/products/etopo-global-relief-model/etopo1',
    archive: '/data/archive/earth/manifest.json',
  },
  {
    title: 'OSM / Lower Manhattan buildings',
    kind: 'Cartographic · reported + assumed',
    detail:
      '522 building footprints from OpenStreetMap. Use a reported height when available, otherwise 3 m per level or a 9 m fallback.',
    meaning:
      'Extrusions show what a footprint-and-height database can construct. Click a building to inspect its specific height method. All buildings use a local sea-level datum and 1× height. Roofs are flat; walls are not surveyed facades.',
    source: 'https://www.openstreetmap.org/copyright',
    archive: '/data/archive/earth/manifest.json',
  },
  {
    title: 'USGS NAIP / aerial photography',
    kind: 'Observed · image mosaic',
    detail:
      'Lower Manhattan, 2048 × 1536 local export. The service catalogue includes 2019 and 2023 acquisitions; this export does not establish a single acquisition date.',
    meaning:
      'Aerial photography textures the local ground and flat roofs. It is not a reconstruction of facade materials, flood depths or a historical event.',
    source:
      'https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer',
    archive: '/data/archive/earth/manifest.json',
  },
  {
    title: 'NASA Blue Marble + Natural Earth',
    kind: 'Observed composite + cartographic',
    detail:
      'January 2004 global surface mosaic with separate Natural Earth coastline and country-boundary vectors.',
    meaning:
      'The basemap and boundaries give geographic orientation. They are not contemporary weather measurements or a statement that borders are uncontested.',
    source: 'https://visibleearth.nasa.gov/collection/1484/blue-marble',
    archive: '/SOURCES.md',
  },
  {
    title: 'Transport / passive tracers',
    kind: 'Calculated · teaching experiment',
    detail:
      'The active contribution supplies an idealized or gridded wind field. The worker calculates horizontal transport, spreading, vertical mixing and removal.',
    meaning:
      'The military-weather case combines sourced history with a deliberately synthetic transport exercise. Tracer proximity does not establish rainfall modification, exposure, injury or political causality. Satellite and terrain layers do not drive this calculation.',
    source: 'https://history.state.gov/historicaldocuments/frus1964-68v28/d274',
    archive: '/examples/popeye-1966.json',
  },
];

export function EarthSources({ onClose }: { onClose: () => void }) {
  return (
    <aside className="intro sources-panel" aria-label="Dataset sources">
      <Button
        variant="ghost"
        size="icon-sm"
        className="panel-close"
        aria-label="Close sources"
        onClick={onClose}
      >
        <X />
      </Button>
      <h2>What this Earth is made of</h2>
      <p>
        Different dates, resolutions and ways of knowing share a scene. They do
        not become one measurement.
      </p>
      {datasets.map((d, i) => (
        <details key={d.title} open={i < 2}>
          <summary>
            {String(i + 1).padStart(2, '0')} / {d.title}
          </summary>
          <span className="source-kind">{d.kind}</span>
          <p>{d.detail}</p>
          <p>{d.meaning}</p>
          <a href={d.source} target="_blank" rel="noreferrer">
            Read the source ↗
          </a>
          {d.archive !== '/SOURCES.md' && (
            <a href={d.archive} download>
              Archive / provenance ↓
            </a>
          )}
        </details>
      ))}
    </aside>
  );
}
