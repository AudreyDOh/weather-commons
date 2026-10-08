"""Archive NOAA relief and a bounded OSM building sample; derive metre-based geometry inputs."""
from pathlib import Path
import urllib.request, urllib.parse, json, hashlib, datetime
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parents[1] / 'public/data/archive/earth'
root.mkdir(parents=True, exist_ok=True)
records = []
def acquire(name, url, data=None):
    path = root / name
    if not path.exists():
        request = urllib.request.Request(url, data=data, headers={'User-Agent':'WeatherCommons research pilot'})
        with urllib.request.urlopen(request, timeout=120) as response:
            path.write_bytes(response.read())
    records.append({'file':name, 'url':url, 'retrievedAt':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(), 'transform':'Original response bytes retained', 'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    return path

service='https://gis.ngdc.noaa.gov/arcgis/rest/services/DEM_mosaics/ETOPO1_ice_surface/ImageServer'
acquire('etopo-service.json', service+'?f=pjson')
params={'bbox':'-180,-90,180,90','bboxSR':'4326','imageSR':'4326','size':'2048,1024','format':'tiff','pixelType':'F32','noData':'-32768','interpolation':'+RSP_BilinearInterpolation','renderingRule':json.dumps({'rasterFunction':'None'}),'f':'image'}
params['interpolation']='RSP_BilinearInterpolation'
path=acquire('etopo1.tif',service+'/exportImage?'+urllib.parse.urlencode(params))
grid=np.asarray(Image.open(path)).astype(np.float32)
assert grid.shape==(1024,2048),grid.shape
assert np.isfinite(grid).all() and grid.min()>-12000 and grid.max()<9000,(grid.min(),grid.max())
grid.round().astype('<i2').tofile(root/'elevation.i16')
records.append({'file':'elevation.i16','sha256':hashlib.sha256((root/'elevation.i16').read_bytes()).hexdigest(),'transform':'Round NOAA bilinearly resampled elevation to signed little-endian int16 metres; row 0 north, cell-centred 2048 x 1024 global grid.'})
query='[out:json][timeout:60];way["building"](40.703,-74.018,40.713,-74.006);out tags geom;'
osm=acquire('buildings-osm.json','https://overpass-api.de/api/interpreter?'+urllib.parse.urlencode({'data':query}))
buildings=[]
for item in json.loads(osm.read_text(encoding='utf-8'))['elements']:
    ring=[[p['lon'],p['lat']] for p in item.get('geometry',[])]
    if len(ring)<4 or ring[0]!=ring[-1]: continue
    tags=item.get('tags',{})
    try:
        if 'height' in tags:
            height=float(tags['height'].replace(' m','')); method='OSM height tag'
        elif 'building:levels' in tags:
            height=float(tags['building:levels'])*3; method='Assumed 3 m per OSM level'
        else: height=9; method='Assumed 9 m; no height tag'
    except ValueError: height=9; method='Assumed 9 m; unparsed height tag'
    buildings.append({'id':item['id'],'name':tags.get('name','Building'),'height':max(3,min(600,height)),'heightMethod':method,'ring':ring})
(root/'buildings.json').write_text(json.dumps(buildings,separators=(',',':')))
records.append({'file':'buildings.json','sha256':hashlib.sha256((root/'buildings.json').read_bytes()).hexdigest(),'transform':'Closed OSM ways only. Heights from tags, 3m/level or explicit 9m fallback. Flat roofs, no facade textures. Not a historical reconstruction.'})
naip='https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer'
acquire('naip-service.json',naip+'?f=pjson')
photoParams={'bbox':'-74.024,40.699,-74.0,40.717','bboxSR':'4326','imageSR':'4326','size':'2048,1536','format':'jpg','f':'image','adjustAspectRatio':'false'}
acquire('manhattan-naip.jpg',naip+'/exportImage?'+urllib.parse.urlencode(photoParams))
queryParams={'geometry':'-74.024,40.699,-74.0,40.717','geometryType':'esriGeometryEnvelope','inSR':'4326','spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false','f':'json'}
acquire('naip-catalogue.json',naip+'/query?'+urllib.parse.urlencode(queryParams))
manifest={'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'relief':{'name':'NOAA ETOPO1 ice-surface global relief','kind':'modelled relief compilation','width':2048,'height':1024,'units':'metres relative to sea level','min':float(grid.min()),'max':float(grid.max()),'source':service,'resolution':'0.17578125 degrees; overview only'},'buildings':{'kind':'cartographic footprints / mixed reported and assumed heights','count':len(buildings),'extent':[ -74.018,40.703,-74.006,40.713],'attribution':'© OpenStreetMap contributors, ODbL','source':'https://www.openstreetmap.org/copyright'},'files':records}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Relief:',grid.min(),grid.max(),'metres. Buildings:',len(buildings))
