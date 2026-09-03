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

## Recommended technical sequence

Start with NASA GIBS daily imagery on the existing globe: it is tiled, global, and manageable. Then add a single regional geostationary cloud adapter, driven by an explicit frame catalogue and a cache of roughly 6–12 frames. Introduce terrain and bathymetry only after the imagery-time architecture is stable. For a public version, put cataloguing, reprojection, and heavy GRIB/NetCDF work behind a server job and distribute bounded web tiles or sampled fields.
