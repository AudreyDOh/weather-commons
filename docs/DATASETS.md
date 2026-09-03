# Dataset and model pathways

This is a curatorial menu, not a claim that every source should be combined. Select a small number of compatible layers and record the time, spatial resolution, processing, license, and uncertainty of each one.

## Observed imagery and clouds

| Source | Useful layer | Best workshop use |
| --- | --- | --- |
| [NASA GIBS](https://earthdata.nasa.gov/eosdis/science-system-description/eosdis-components/gibs) | Global MODIS/VIIRS imagery served as tiled time slices | Daily or near-daily historical sequences; first dynamic-image prototype |
| [NOAA GOES open data](https://registry.opendata.aws/noaa-goes/) | Geostationary visible and infrared cloud imagery over the Americas | 5–10 minute regional cloud loops and storm narratives |
| [EUMETSAT Data Store](https://data.eumetsat.int/) | Meteosat imagery and derived products | European, African, and Indian Ocean studies |
| [JMA Himawari](https://www.data.jma.go.jp/mscweb/en/himawari89/) | Geostationary imagery over Asia and the Pacific | Pacific typhoons, monsoon systems, and regional circulation |

Satellite imagery is an observation product with its own viewing geometry and processing. It is not the solver's wind field, and animated clouds must be labelled with their acquisition time and band.

## Atmosphere and transport

| Source or method | Useful layer | Best workshop use |
| --- | --- | --- |
| [ERA5](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels) | Historical, gridded reanalysis of wind, temperature, pressure, and precipitation | Historical comparison and reproducible sampled fields |
| [NOAA GFS](https://registry.opendata.aws/noaa-gfs-bdp-pds/) | Global forecast fields | Short-lived forecast studies; preserve issue time and lead time |
| [ECMWF open data](https://www.ecmwf.int/en/forecasts/datasets/open-data) | Recent forecast products | Comparing institutional forecast products |
| [NOAA HYSPLIT](https://www.arl.noaa.gov/hysplit/) | Established trajectory and dispersion model | A validation reference for a clearly bounded teaching experiment |

Use a reanalysis for “what did the modelled historical atmosphere look like?” and a forecast for “what did an institution project at a particular issue time?” Neither is a direct sensor record.

## Ocean and physical geography

| Source | Useful layer | Best workshop use |
| --- | --- | --- |
| [GEBCO](https://www.gebco.net/data-and-products/gridded-bathymetry-data) | Global gridded bathymetry | Ocean depth mesh, shelf breaks, and seafloor context |
| [Copernicus Marine](https://data.marine.copernicus.eu/) | Sea-surface temperature, currents, waves, salinity, and sea level | Current fields alongside, never substituted for, atmospheric flow |
| [Natural Earth](https://www.naturalearthdata.com/) | Boundaries, coastlines, rivers, populated places | Lightweight cartographic context and workshop waypoints |

Bathymetry is mostly static physical geography. Ocean currents are a different observed/modelled vector field from air movement; they require their own units, depth, timestamps, and integrator.

## Sensing and institutional geography

| Source | Useful layer | Best workshop use |
| --- | --- | --- |
| [WMO OSCAR/Surface](https://oscar.wmo.int/surface/) | Station and observing-system metadata | Maps of sensing networks and gaps |
| [WMO OSCAR/Space](https://space.oscar.wmo.int/) | Satellite mission metadata | Orbital observing infrastructure and instrument histories |
| National meteorological archives and institutional reports | Station histories, model centres, procurement, and governance | Case-specific evidence; cite the original record |

## Implemented depth sources

The **Sources** drawer exposes the currently loaded archives; **Explore** provides five guided views. GOES colour JPEGs are approximately registered on the 3D globe. They are not calibrated pixel sources for geographic measurement.

- **ACHA cloud-top height:** twelve GOES-19 ABI-L2-ACHAF scan windows, 3 September 2026 04:10–06:00 UTC. Native 10 km product, decimated to about 20 km at nadir, retaining only DQF=0. Raw NetCDF, quality flags, navigation and derived arrays are archived. This is the 10 km stream, not the separate ACHA2KM product. Use for comparing visual cloud appearance with a retrieved quantity, missingness and display exaggeration.
- **ETOPO1:** signed land/seafloor elevations resampled to a 2048 × 1024 overview. The sea-level surface is separate geometry. Use to interrogate a datum, vertical scale and the difference between an overview model and a local survey.
- **OSM + USGS NAIP:** 522 Lower Manhattan footprints, tagged or explicitly assumed heights, local aerial roof/ground textures. Click a building to inspect the original way and height rule. Use to ask how records become architecture and where absence is replaced by a convention.

## Next technical sequence

Calibrated ABI colour reprojection and cloud-parallax assessment should precede precise image/height overlays. Regional terrain tiles and surveyed city geometry should replace coarse relief and the flat local datum where a case demands street-scale analysis. Himawari or Meteosat would extend the currently Americas-centred observation archive. A public version needs server-side cataloguing/conversion and bounded, versioned web tiles; participants should not download global NetCDF volumes.
