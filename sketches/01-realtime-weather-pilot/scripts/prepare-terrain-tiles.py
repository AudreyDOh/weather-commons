"""Archive USGS inputs and build a bounded, self-hostable OGC 3D Tiles terrain pyramid.
Requires Python, NumPy, Pillow. No API key. Existing original responses are reused.
"""
from pathlib import Path
import json, hashlib, datetime, urllib.request, urllib.parse, io, struct
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]/'public/data/archive/rainier'
ROOT.mkdir(parents=True,exist_ok=True)
# A regional example, not global or street-level terrain coverage.
BOUNDS=[-121.98,46.72,-121.55,47.0]
W,S,E,N=BOUNDS
DEM='https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer'
NAIP='https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPImagery/ImageServer'
records=[]
def fetch(item):
 name,url=item; p=ROOT/name
 if not p.exists():
  req=urllib.request.Request(url,headers={'User-Agent':'WeatherCommons research pilot'})
  p.write_bytes(urllib.request.urlopen(req,timeout=120).read())
 return {'file':name,'url':url,'retrievedAt':datetime.datetime.fromtimestamp(p.stat().st_mtime,datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
def export(base,**kwargs):
 return base+'/exportImage?'+urllib.parse.urlencode({'bbox':','.join(map(str,BOUNDS)),'bboxSR':4326,'imageSR':4326,'adjustAspectRatio':'false','f':'image',**kwargs})
query={'geometry':','.join(map(str,BOUNDS)),'geometryType':'esriGeometryEnvelope','inSR':4326,'spatialRel':'esriSpatialRelIntersects','outFields':'*','returnGeometry':'false','f':'json'}
inputs=[('dem-service.json',DEM+'?f=pjson'),('naip-service.json',NAIP+'?f=pjson'),('dem.tif',export(DEM,size='513,513',format='tiff',pixelType='F32',interpolation='RSP_BilinearInterpolation',renderingRule=json.dumps({'rasterFunction':'None'}))),('dem-catalogue.json',DEM+'/query?'+urllib.parse.urlencode(query)),('naip-catalogue.json',NAIP+'/query?'+urllib.parse.urlencode(query))]
for y in range(2):
 for x in range(2):
  bbox=[W+(E-W)*x/2,N-(N-S)*(y+1)/2,W+(E-W)*(x+1)/2,N-(N-S)*y/2]
  inputs.append((f'aerial-{x}-{y}.jpg',export(NAIP,bbox=','.join(map(str,bbox)),size='2048,2048',format='jpg',compressionQuality=90)))
records=list(ThreadPoolExecutor(max_workers=2).map(fetch,inputs))
grid=np.asarray(Image.open(ROOT/'dem.tif'),dtype=np.float64)
assert grid.shape==(513,513) and np.isfinite(grid).all() and grid.min()>-500 and grid.max()<6000, 'Unexpected DEM response'
image=Image.new('RGB',(4096,4096))
for y in range(2):
 for x in range(2):
  patch=Image.open(ROOT/f'aerial-{x}-{y}.jpg').convert('RGB');assert patch.size==(2048,2048)
  image.paste(patch,(2048*x,2048*y))
grid.astype('<f4').tofile(ROOT/'elevation.f32')
R=6371000.
def point(lon,lat,h):
 lo=np.deg2rad(lon);la=np.deg2rad(lat);r=R+h
 return np.stack([r*np.cos(la)*np.cos(lo),r*np.cos(la)*np.sin(lo),r*np.sin(la)],axis=-1)
# Exported image pixels are cell centres. Sample those at the mesh's geographic vertices.
def sample(lon,lat):
 x=np.clip((lon-W)/(E-W)*513-.5,0,512);y=np.clip((N-lat)/(N-S)*513-.5,0,512)
 a=np.floor(x).astype(int);b=np.floor(y).astype(int);dx=x-a;dy=y-b
 return (grid[b,a]*(1-dx)+grid[b,np.minimum(512,a+1)]*dx)*(1-dy)+(grid[np.minimum(512,b+1),a]*(1-dx)+grid[np.minimum(512,b+1),np.minimum(512,a+1)]*dx)*dy
derived=[]
def write_glb(name,positions,uv,indices,texture):
 # glTF is Y-up; 3D Tiles rotates content into the tileset's Z-up frame.
 positions=positions[:,[0,2,1]]*np.array([1,1,-1])
 parts=[];views=[];accessors=[]
 def blob(data,target=None):
  offset=sum(len(p) for p in parts);parts.append(data+b'\0'*((-len(data))%4));v={'buffer':0,'byteOffset':offset,'byteLength':len(data)}
  if target:v['target']=target
  views.append(v);return len(views)-1
 def accessor(array,component,kind,target):
  v=blob(array.tobytes(),target);a={'bufferView':v,'componentType':component,'count':len(array),'type':kind}
  if kind=='VEC3':a.update({'min':array.min(axis=0).tolist(),'max':array.max(axis=0).tolist()})
  accessors.append(a);return len(accessors)-1
 pos=accessor(positions.astype('<f4'),5126,'VEC3',34962)
 tex=accessor(uv.astype('<f4'),5126,'VEC2',34962)
 idx=accessor(indices.astype('<u2').reshape(-1),5123,'SCALAR',34963)
 photo=blob(texture)
 binary=b''.join(parts)
 gltf={'asset':{'version':'2.0','generator':'Weather Commons / archived USGS terrain'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0}], 'meshes':[{'primitives':[{'attributes':{'POSITION':pos,'TEXCOORD_0':tex},'indices':idx,'material':0}]}], 'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':1},'extensions':{'KHR_materials_unlit':{}}}], 'extensionsUsed':['KHR_materials_unlit'],'textures':[{'source':0,'sampler':0}],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'images':[{'bufferView':photo,'mimeType':'image/jpeg'}], 'buffers':[{'byteLength':len(binary)}],'bufferViews':views,'accessors':accessors}
 js=json.dumps(gltf,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
 out=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
 (ROOT/name).write_bytes(out);derived.append({'file':name,'sha256':hashlib.sha256(out).hexdigest(),'bytes':len(out)})
def tile(level,x,y,parent_origin):
 divisions=2**level; west=W+(E-W)*x/divisions;east=W+(E-W)*(x+1)/divisions;north=N-(N-S)*y/divisions;south=N-(N-S)*(y+1)/divisions
 lon,lat=np.meshgrid(np.linspace(west,east,65),np.linspace(north,south,65));heights=sample(lon,lat)
 origin=point((west+east)/2,(south+north)/2,float(heights.mean()))
 positions=point(lon,lat,heights).reshape(-1,3)-origin
 u,v=np.meshgrid(np.linspace(0,1,65),np.linspace(0,1,65));uv=np.stack([u,v],axis=-1).reshape(-1,2)
 indices=[]
 for j in range(64):
  for i in range(64):
   a=j*65+i;b=a+65;indices.extend([a,b,a+1,b,b+1,a+1])
 # Downward edge skirts hide LOD cracks; these are display geometry, not surveyed cliffs.
 edge=list(range(65))+[j*65+64 for j in range(1,65)]+list(range(64*65+63,64*65-1,-1))+[j*65 for j in range(63,0,-1)]
 skirt=point(lon.reshape(-1)[edge],lat.reshape(-1)[edge],heights.reshape(-1)[edge]-3000)-origin
 first=len(positions);positions=np.concatenate([positions,skirt]);uv=np.concatenate([uv,uv[edge]])
 for i,a in enumerate(edge):
  j=(i+1)%len(edge);b=edge[j];indices.extend([a,first+i,b,b,first+i,first+j])
 crop=image.crop((x*4096/divisions,y*4096/divisions,(x+1)*4096/divisions,(y+1)*4096/divisions)).resize((512,512),Image.Resampling.LANCZOS)
 buf=io.BytesIO();crop.save(buf,format='JPEG',quality=88)
 name=f'{level}-{x}-{y}.glb';write_glb(name,positions,uv,np.array(indices),buf.getvalue())
 transform=np.eye(4);transform[:3,3]=origin-parent_origin
 radius=float(np.linalg.norm(positions,axis=1).max()+2)
 node={'boundingVolume':{'sphere':[0,0,0,radius]},'geometricError':0 if level==3 else 500/(2**level),'refine':'REPLACE','transform':transform.T.reshape(-1).tolist(),'content':{'uri':name},'extras':{'level':level,'bounds':[west,south,east,north],'sampleSpacingMetresApprox':round((N-S)*111195/(64*divisions))}}
 if level<3:node['children']=[tile(level+1,x*2+i,y*2+j,origin) for j in range(2) for i in range(2)]
 return node
root=tile(0,0,0,np.zeros(3))
tileset={'asset':{'version':'1.1','gltfUpAxis':'Y'},'geometricError':1e6,'root':root,'extras':{'source':'USGS 3DEP and NAIP','heightReference':'Source elevation, displayed radially on a 6371 km sphere; not ellipsoidal or flood-analysis height'}}
(ROOT/'tileset.json').write_text(json.dumps(tileset,separators=(',',':')))
for name in ['tileset.json','elevation.f32']:
 p=ROOT/name;derived.append({'file':name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'bytes':p.stat().st_size})
manifest={'title':'Mount Rainier / USGS terrain and aerial mosaic','bounds':BOUNDS,'gridSize':513,'sourceSpacingMetresApprox':61,'imagerySpacingMetresApprox':8,'levels':4,'tileCount':85,'meshCellsPerTile':64,'heightRangeMetres':[float(grid.min()),float(grid.max())],'heightReference':'3DEP source elevations; the service catalogue records vertical datums. Displayed radially on a reference sphere, not transformed to ellipsoidal heights.','kind':'modelled bare-earth elevation / observed aerial composite','source':DEM,'imagerySource':NAIP,'transform':'Archive F32 DEM export (513 x 513, bilinear, WGS84) and four 2048 x 2048 NAIP exports assembled as a 4096 x 4096 mosaic. Cell-centred DEM sampled onto four quadtree levels of 65 x 65 vertices. Local ECEF-like spherical coordinates in metres with tile translations and standard Y-up glTF; renderer maps into shared Earth axes. Source colours unlit. Image crops JPEG quality 88. 3000 m downward skirts are display seam handling, not measured cliff faces. Fixed regional extent; no invented detail beyond archived source resolution.','files':records,'derived':derived}
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Built',len(derived)-2,'3D Tiles; source elevations',manifest['heightRangeMetres'],'m; derived',round(sum(d['bytes'] for d in derived)/1e6,1),'MB')
