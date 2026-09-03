"""Prepare matched NOAA ACHA cloud-top retrievals, keeping good-quality pixels only."""
from pathlib import Path
from netCDF4 import Dataset
import numpy as np
import json, urllib.request, hashlib, datetime, xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

root=Path(__file__).resolve().parents[1]/'public/data/archive/cloud-height'
root.mkdir(parents=True,exist_ok=True)
goes=json.loads((root.parent/'goes/manifest.json').read_text())
times=[f['time'] for f in goes['products'][0]['frames']]
keys=[]
for hour in ['04','05','06']:
    url=f'https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=ABI-L2-ACHAF/2026/246/{hour}/'
    path=root/f'listing-{hour}.xml'
    if not path.exists(): path.write_bytes(urllib.request.urlopen(url,timeout=60).read())
    tree=ET.fromstring(path.read_bytes())
    keys.extend(n.text for n in tree.iter() if n.tag.endswith('}Key'))

def prepare(time):
    dt=datetime.datetime.fromisoformat(time.replace('Z','+00:00'))
    stamp=dt.strftime('%Y%j%H%M')
    key=next(k for k in keys if '_s'+stamp in k)
    url='https://noaa-goes19.s3.amazonaws.com/'+key
    path=root/key.split('/')[-1]
    if not path.exists():path.write_bytes(urllib.request.urlopen(url,timeout=120).read())
    return time,path,url
downloads=list(ThreadPoolExecutor(max_workers=3).map(prepare,times))
records=[]
for time,path,url in downloads:
    with Dataset(path) as ds:
        quality=ds['DQF'][::2,::2]
        height=ds['HT'][::2,::2]
        # netCDF4 applies scale_factor/add_offset and masks fill values.
        valid=(quality==0)&~np.ma.getmaskarray(height)&np.isfinite(height)&(height>=0)&(height<=20000)
        out=np.where(valid,np.ma.filled(height,65535),65535).round().astype('<u2')
        outName=path.stem+'.u16';out.tofile(root/outName)
        records.append({'time':time,'start':ds.time_coverage_start,'end':ds.time_coverage_end,'source':url,'original':path.name,'retrievedAt':datetime.datetime.fromtimestamp(path.stat().st_mtime,datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'file':'/data/archive/cloud-height/'+outName,'derivedSha256':hashlib.sha256((root/outName).read_bytes()).hexdigest(),'validPixels':int(valid.sum()),'minMetres':float(height[valid].min()),'maxMetres':float(height[valid].max())})
        if len(records)==1:
            p=ds['goes_imager_projection'];req=float(p.semi_major_axis);rp=float(p.semi_minor_axis);H=float(p.perspective_point_height)+req;lon0=float(p.longitude_of_projection_origin)
            x,y=np.meshgrid(np.asarray(ds['x'][::2],dtype='float64'),np.asarray(ds['y'][::2],dtype='float64'))
            a=np.sin(x)**2+np.cos(x)**2*(np.cos(y)**2+req*req/(rp*rp)*np.sin(y)**2)
            b=-2*H*np.cos(x)*np.cos(y);c=H*H-req*req
            disc=b*b-4*a*c;rs=(-b-np.sqrt(np.maximum(0,disc)))/(2*a)
            sx=rs*np.cos(x)*np.cos(y);sy=-rs*np.sin(x);sz=rs*np.cos(x)*np.sin(y)
            lon=np.deg2rad(lon0)-np.arctan2(sy,H-sx)
            lat=np.arctan(req*req/(rp*rp)*sz/np.hypot(H-sx,sy))
            coords=np.stack([np.rad2deg(lon),np.rad2deg(lat)],axis=-1);coords[disc<0]=0
            coords.astype('<f4').tofile(root/'navigation.f32')
            metadata={'width':out.shape[1],'height':out.shape[0],'nativeSize':[1086,1086],'decimation':2,'nominalSpacing':'native 10 km at nadir; displayed every second source sample (~20 km at nadir)','projection':{k:float(getattr(p,k)) for k in ['perspective_point_height','semi_major_axis','semi_minor_axis','longitude_of_projection_origin']},'qualityFlagMeanings':ds['DQF'].flag_meanings}
manifest={**metadata,'title':'GOES-19 ABI ACHA cloud-top geopotential height','kind':'satellite retrieval','units':'metres','missingValue':65535,'source':'https://www.ncei.noaa.gov/access/metadata/landing-page/bin/iso?id=gov.noaa.ncdc%3AC01505','algorithm':'https://www.star.nesdis.noaa.gov/goesr/docs/ATBD/Cloud_Height.pdf','transform':'Decode packed HT, keep DQF=0 good quality and valid 0–20000m heights, take every second row and column, round to integer metres. No gap filling. Geographic footprints use source fixed-grid ellipsoid navigation. Heights are rendered radially above a reference sphere; cloud parallax is not corrected. Triangles are a display interpolation and omitted across missing cells or >2500m jumps.','navigation':{'file':'/data/archive/cloud-height/navigation.f32','sha256':hashlib.sha256((root/'navigation.f32').read_bytes()).hexdigest()},'frames':records}
manifest['listings']=[{'file':f.name,'url':f'https://noaa-goes19.s3.amazonaws.com/?list-type=2&prefix=ABI-L2-ACHAF/2026/246/{f.stem.split("-")[-1]}/','retrievedAt':datetime.datetime.fromtimestamp(f.stat().st_mtime,datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()} for f in sorted(root.glob('listing-*.xml'))]
(root/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Prepared',len(records),'ACHA frames;',metadata['width'],'x',metadata['height'],'good-quality points only')
