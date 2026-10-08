(async function(){
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const R=Math.random, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const LON0=-145,LON1=-127,LAT0=49,LAT1=58;              // frame extent
const FW=1800,FH=900;                                     // frame in plane pixels (one rendering contract)
const CW=256,CH=128, CS=FW/CW;                            // finest cells and their size in px
const GW=64,GH=32;                                        // coarse field grid for the simulation state
const KM_LAT=111, KM_LON=111*Math.cos(53.3*Math.PI/180);
const UNPAINTED=255, HIDDEN=254;
const EPOCH=Date.UTC(2012,6,14);                          // sim day 0 = 14 July 2012
const dayNum=iso=>Math.round((Date.parse(iso+'T00:00:00Z')-EPOCH)/86400000);
const Z={composite:0,grid:0,map:50,sea:100,cloud:220,inst:300};
const fmt=d=>new Date(EPOCH+d*86400000).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const fmtS=iso=>new Date(iso+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'});

// ---------- calendar ----------
const load=src=>new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(new Error(src));im.src=src});
const index=await (await fetch('cal/index.json')).json();
const CAL=index.map(e=>({...e,n:dayNum(e.date)}));
const [coast,...imgs]=await Promise.all([load('cal/coast.png'),...CAL.flatMap(e=>[load(`cal/true/${e.date}.jpg`),load(`cal/chl/${e.date}.png`)])]);
const oc=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
for(let i=0;i<CAL.length;i++){const e=CAL[i];e.colour=imgs[i*2];e.chlImg=imgs[i*2+1];
  const g=oc(FW,FH),gx=g.getContext('2d');gx.filter='grayscale(1)';gx.drawImage(e.colour,0,0);e.grey=g;
  const ch=oc(FW,FH),cx=ch.getContext('2d');cx.drawImage(e.grey,0,0);cx.globalCompositeOperation='lighten';cx.drawImage(e.chlImg,0,0,FW,FH);e.chl=ch;
  // per finest cell: chlorophyll level (−1 no data) and cloud fraction
  const s=oc(CW*2,CH*2),sx=s.getContext('2d');sx.drawImage(e.colour,0,0,CW*2,CH*2);const t=sx.getImageData(0,0,CW*2,CH*2).data;
  sx.drawImage(e.chlImg,0,0,CW,CH);const q=sx.getImageData(0,0,CW,CH).data;
  e.cloud=new Float32Array(CW*CH);e.chlv=new Float32Array(CW*CH);
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){let k=0;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const j=((y*2+dy)*CW*2+(x*2+dx))*4,r=t[j],g2=t[j+1],b=t[j+2],l=(r+g2+b)/3,sat=Math.max(r,g2,b)-Math.min(r,g2,b);if(l>150&&sat<40)k++}
    const c=y*CW+x;e.cloud[c]=k/4;const v=q[c*4];e.chlv[c]=v?clamp((v/255-.4)/.45,0,1):-1}
  // pyramids: level 0 = finest, level l = CW>>l cells across; chlorophyll averaged over data cells, −1 if none
  e.cloudL=[e.cloud];e.chlL=[e.chlv];
  for(let l=1;l<=3;l++){const w=CW>>l,h=CH>>l,pc=e.cloudL[l-1],pv=e.chlL[l-1],pw=w*2,cl=new Float32Array(w*h),cv=new Float32Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=0,sv=0,n=0;for(let j=0;j<2;j++)for(let i=0;i<2;i++){const q2=(y*2+j)*pw+x*2+i;s+=pc[q2];if(pv[q2]>=0){sv+=pv[q2];n++}}cl[y*w+x]=s/4;cv[y*w+x]=n?sv/n*(n>=2?1:.8):-1}
    e.cloudL.push(cl);e.chlL.push(cv)}}
const dayAt=(e,lon,lat)=>e.chlv[(((LAT1-lat)/(LAT1-LAT0)*CH)|0)*CW+(((lon-LON0)/(LON1-LON0)*CW)|0)];
const wAt=(e,lon,lat)=>e.cloud[(((LAT1-lat)/(LAT1-LAT0)*CH)|0)*CW+(((lon-LON0)/(LON1-LON0)*CW)|0)];

// ---------- picture (assignment rasters at the finest level) ----------
const rule=new Uint8Array(CW*CH).fill(UNPAINTED), strokes=new Uint8Array(CW*CH).fill(UNPAINTED), compose=new Uint8Array(CW*CH);
let blocks=[], usage=new Float32Array(CAL.length), history=[];
function recompose(){for(let i=0;i<compose.length;i++)compose[i]=strokes[i]!==UNPAINTED?strokes[i]:rule[i];
  usage.fill(0);let n=0;for(let i=0;i<compose.length;i++){const v=compose[i];if(v<CAL.length){usage[v]++;n++}}if(n)for(let i=0;i<usage.length;i++)usage[i]/=n;
  blocks=toBlocks(compose)}
function toBlocks(a){const out=[];
  const rec=(x,y,s)=>{const v=a[y*CW+x];let uni=true;
    for(let j=y;j<y+s&&uni;j++)for(let i=x;i<x+s;i++)if(a[j*CW+i]!==v){uni=false;break}
    if(uni||s===1){out.push({x,y,w:s,h:s,v});return}const h=s/2;rec(x,y,h);rec(x+h,y,h);rec(x,y+h,h);rec(x+h,y+h,h)};
  for(let y=0;y<CH;y+=128)for(let x=0;x<CW;x+=128)rec(x,y,128);return out}
const cellOf=(fx,fy)=>[clamp((fx/CS)|0,0,CW-1),clamp((fy/CS)|0,0,CH-1)];
function stamp(cx,cy,r,v){const r2=r*r;for(let y=Math.max(0,cy-r);y<=Math.min(CH-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(CW-1,cx+r);x++){const dx=x-cx+.5,dy=y-cy+.5;if(dx*dx+dy*dy<=r2)strokes[y*CW+x]=v}}

// ---------- simulation (sea) ----------
const OLD_MASSETT=[-132.18,54.04];
const ENVELOPE=[[-140.5,51.5],[-135.5,51.5],[-135.5,54.3],[-140.5,54.3]];
const EDDIES=[{c:[-137.3,52.7],r:90,sign:1},{c:[-134.6,53.9],r:70,sign:1},{c:[-140.2,54.6],r:80,sign:-1}];
const LEGS=[[-137.06,52.85],[-137.9,52.4],[-136.4,52.3],[-136.6,53.3],[-138.0,53.1],[-137.06,52.85],[-132.18,54.04]];
const P={iron:120,eddy:.6,graze:.5,wind:.5};
const Wt={bloom:1,sky:.2,wake:0,clock:.3};
let day=0,running=true,ship,iron,plank,exported,respired,peakArea,area,clouds;
const wake=new Float32Array(CW*CH);                       // sim day the ship last passed near each cell (−1 never)
function reset(){day=0;ship={lon:OLD_MASSETT[0],lat:OLD_MASSETT[1],leg:0,acc:0,track:[]};iron=[];plank=[];exported=0;respired=0;peakArea=0;area=0;wake.fill(-1);
  clouds=[];for(let i=0;i<2600;i++)clouds.push({x:R()*FW,y:R()*FH,s:5+R()*9,p:R()*6.283});rule.fill(UNPAINTED)}
reset();
function flow(lon,lat){let u=0.6,v=1.2;
  for(const e of EDDIES){const dx=(lon-e.c[0])*KM_LON,dy=(lat-e.c[1])*KM_LAT,d=Math.hypot(dx,dy)+1e-6;const s=e.sign*P.eddy*18*Math.exp(-(d*d)/(e.r*e.r))*(d/e.r)/(0.6+(d/e.r));u+=s*(dy/d);v+=-s*(dx/d)}
  return [u,v]}
function advect(q,dt){const [u,v]=flow(q.lon,q.lat);q.lon+=u*dt/KM_LON+(R()-.5)*0.22*dt;q.lat+=v*dt/KM_LAT+(R()-.5)*0.14*dt}
const fx=(lon)=>(lon-LON0)/(LON1-LON0)*FW, fy=(lat)=>(LAT1-lat)/(LAT1-LAT0)*FH;
function stepShip(dt){const tgt=ship.leg<LEGS.length?LEGS[ship.leg]:null;if(!tgt)return;
  const dx=(tgt[0]-ship.lon)*KM_LON,dy=(tgt[1]-ship.lat)*KM_LAT,d=Math.hypot(dx,dy);const sp=(ship.leg>=1&&ship.leg<=5)?80:300;
  if(d<2){ship.leg++;return}const mv=Math.min(d,sp*dt);ship.lon+=dx/d*mv/KM_LON;ship.lat+=dy/d*mv/KM_LAT;
  if(ship.leg>=1&&ship.leg<=5){ship.acc+=(P.iron/0.25/7)*dt;const n=Math.floor(ship.acc);ship.acc-=n;for(let i=0;i<n;i++)iron.push({lon:ship.lon+(R()-.5)*.06,lat:ship.lat+(R()-.5)*.03,age:0})}
  const [cx,cy]=cellOf(fx(ship.lon),fy(ship.lat));const r=6,r2=r*r;for(let y=Math.max(0,cy-r);y<=Math.min(CH-1,cy+r);y++)for(let x=Math.max(0,cx-r);x<=Math.min(CW-1,cx+r);x++){const ddx=x-cx,ddy=y-cy;if(ddx*ddx+ddy*ddy<=r2)wake[y*CW+x]=day}
  if(ship.track.length===0||Math.hypot(ship.lon-ship.track[ship.track.length-1][0],ship.lat-ship.track[ship.track.length-1][1])>.03)ship.track.push([ship.lon,ship.lat])}
function step(dt){day+=dt;stepShip(dt);
  for(const f of iron){advect(f,dt);f.age+=dt;if(f.age>25)f.dead=true;if(R()<dt*0.4&&plank.length<9000)plank.push({lon:f.lon+(R()-.5)*.15,lat:f.lat+(R()-.5)*.08,age:0})}
  iron=iron.filter(f=>!f.dead);
  const grow=0.32*(iron.length?1:0.1), graze=0.06+P.graze*0.22;const born=[];
  for(const q of plank){advect(q,dt);q.age+=dt;if(plank.length+born.length<9000&&R()<grow*dt)born.push({lon:q.lon+(R()-.5)*.3,lat:q.lat+(R()-.5)*.16,age:0});if(R()<graze*dt){q.dead=true;(R()<0.12?exported++:respired++)}}
  plank=plank.concat(born);plank=plank.filter(q=>!q.dead);
  const cells=new Map();for(const q of plank){const k=((q.lon*4)|0)+'_'+((q.lat*4)|0);cells.set(k,(cells.get(k)||0)+1)}
  let n=0;for(const v of cells.values())if(v>=3)n++;area=n*(0.25*KM_LON)*(0.25*KM_LAT);peakArea=Math.max(peakArea,area);
  // cloud deck: westerlies with a slow swirl, wrapping at the frame edge
  const w=P.wind;for(const c of clouds){c.p+=dt*.6;c.x+=(22+14*w+Math.sin(c.p+c.y*.01)*6)*w*dt*2;c.y+=Math.cos(c.p*.7+c.x*.004)*4*dt;if(c.x>FW+20)c.x-=FW+40;if(c.x<-20)c.x+=FW+40;if(c.y<-20)c.y+=FH+40;if(c.y>FH+20)c.y-=FH+40}}

// ---------- fields and the assignment rule ----------
const fP=new Float32Array(GW*GH),fK=new Float32Array(GW*GH);
function blur(a,w,h){const b=new Float32Array(a.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let s=0,n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const xx=x+i,yy=y+j;if(xx>=0&&yy>=0&&xx<w&&yy<h){s+=a[yy*w+xx];n++}}b[y*w+x]=s/n}return b}
function fields(){fP.fill(0);fK.fill(0);const gx=GW/FW,gy=GH/FH;
  for(const q of plank){const x=(fx(q.lon)*gx)|0,y=(fy(q.lat)*gy)|0;if(x>=0&&y>=0&&x<GW&&y<GH)fP[y*GW+x]++}
  for(const c of clouds){const x=(c.x*gx)|0,y=(c.y*gy)|0;if(x>=0&&y>=0&&x<GW&&y<GH)fK[y*GW+x]+=c.s/9}
  const p=blur(fP,GW,GH),k=blur(fK,GW,GH);for(let i=0;i<p.length;i++){fP[i]=clamp(p[i]/14,0,1);fK[i]=clamp(k[i]/2.2,0,1)}}
const hash=(i,j)=>{let h=(i*73856093)^(j*19349663);h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296};
let level=2,refine=true;                                   // rule cell size: level 0 = finest … 3 = 32×16; finer where the water is active
function assign(){fields();const nd=CAL.length,sc=new Float32Array(nd),D=day;
  const clockW=CAL.map(e=>Wt.clock*Math.exp(-Math.abs(e.n-D)/12));
  // score one cell of size s (finest cells) at level l whose top-left finest cell is (x0,y0)
  const score=(x0,y0,l)=>{const s=1<<l,w=CW>>l,X=x0>>l,Y=y0>>l,i=Y*w+X,cx=x0+(s>>1),cy=y0+(s>>1),c=cy*CW+cx,g=((cy*GH/CH)|0)*GW+((cx*GW/CW)|0),p=fP[g],k=fK[g],tw=wake[c];
    let best=-1,bs=-1e9;const ap=clamp(p*6,.12,1),ak=clamp(k*3,.15,1);   // a witness matters where there is something to witness
    for(let d=0;d<nd;d++){const e=CAL[d],cv=e.chlL[l][i],cl=e.cloudL[l][i];
      let v=Wt.bloom*ap*(cv<0?(1-p)*.5:1-Math.abs(cv-p))+Wt.sky*ak*(1-Math.abs(cl-k))+clockW[d]+hash(c,d)*.012;
      if(tw>=0)v+=Wt.wake*Math.exp(-Math.abs(e.n-tw)/8);
      sc[d]=v;if(v>bs){bs=v;best=d}}
    const cur=rule[c],v=(cur<nd&&sc[cur]+.05>=bs)?cur:best;
    for(let y=y0;y<y0+s;y++)rule.fill(v,y*CW+x0,y*CW+x0+s)};
  const s=1<<level,fl=Math.max(0,level-1),fs=1<<fl;
  for(let y0=0;y0<CH;y0+=s)for(let x0=0;x0<CW;x0+=s){
    let active=false;if(refine&&level>0){const cx=x0+(s>>1),cy=y0+(s>>1),g=((cy*GH/CH)|0)*GW+((cx*GW/CW)|0);active=fP[g]>.1||(wake[cy*CW+cx]>=0&&day-wake[cy*CW+cx]<20)}
    if(active){for(let y=y0;y<y0+s;y+=fs)for(let x=x0;x<x0+s;x+=fs)score(x,y,fl)}else score(x0,y0,level)}
  recompose();dirtyComposite=true}

// ---------- planes (one rendering contract: FW×FH, black on transparent) ----------
const plane={};for(const k of ['composite','grid','map','sea','cloud','inst']){plane[k]=oc(FW,FH);plane[k].ctx=plane[k].getContext('2d')}
const show={composite:true,grid:false,map:true,sea:true,cloud:true,inst:true};let prod='grey',dirtyComposite=true;
function font(ctx,px){ctx.font=`${px}px "ABC Diatype","Helvetica Neue",Helvetica,Arial,sans-serif`}
const pxf=(lon,lat)=>[fx(lon),fy(lat)];
function drawComposite(){const ctx=plane.composite.ctx,g=plane.grid.ctx;ctx.clearRect(0,0,FW,FH);g.clearRect(0,0,FW,FH);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=.6;
  for(const b of blocks){const x=b.x*CS,y=b.y*CS,w=b.w*CS,h=b.h*CS;
    if(b.v<CAL.length){const e=CAL[b.v];ctx.drawImage(prod==='grey'?e.grey:prod==='colour'?e.colour:e.chl,x,y,w,h,x,y,w,h)}
    else if(b.v===HIDDEN){ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h)}
    g.strokeRect(x+.3,y+.3,w-.6,h-.6)}
  dirtyComposite=false}
function drawMap(){const ctx=plane.map.ctx;ctx.clearRect(0,0,FW,FH);ctx.drawImage(coast,0,0);ctx.strokeStyle='#000';ctx.fillStyle='#000';
  ctx.lineWidth=.6;ctx.setLineDash([1,4]);font(ctx,12);ctx.textAlign='left';
  for(let lon=-145;lon<=-127;lon+=3){const x=fx(lon);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,FH);ctx.stroke();ctx.fillText(Math.abs(lon)+'° W',x+4,FH-8)}
  for(let lat=50;lat<=57;lat+=2){const y=fy(lat);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(FW,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(lat+'° N',FW-8,y-4);ctx.textAlign='left'}
  ctx.setLineDash([3,4]);ctx.lineWidth=.9;ctx.beginPath();ENVELOPE.forEach((c,i)=>{const [x,y]=pxf(...c);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.stroke();ctx.setLineDash([]);
  {const [x,y]=pxf(-140.5,54.3);ctx.fillText('Reported bloom envelope, 2012',x+5,y-6)}
  for(const e of EDDIES){const [x,y]=pxf(...e.c);ctx.lineWidth=.7;ctx.setLineDash([1,3]);ctx.beginPath();ctx.arc(x,y,e.r/KM_LON*(FW/(LON1-LON0)),0,6.2832);ctx.stroke();ctx.setLineDash([])}
  {const [x,y]=pxf(...EDDIES[0].c);ctx.textAlign='center';ctx.fillText('Haida eddy',x,y-EDDIES[0].r/KM_LON*(FW/(LON1-LON0))-6);ctx.textAlign='left'}
  ctx.setLineDash([2,3]);ctx.lineWidth=.7;ctx.beginPath();LEGS.forEach((c,i)=>{const [x,y]=pxf(...c);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.setLineDash([]);
  {const [x,y]=pxf(...OLD_MASSETT);ctx.beginPath();ctx.arc(x,y,3,0,6.2832);ctx.fill();ctx.fillText('Old Massett',x+7,y-5)}
  {const kmpx=FW/(LON1-LON0)/KM_LON,x0=FW-30-200*kmpx,y0=22;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x0+200*kmpx,y0);ctx.moveTo(x0,y0-4);ctx.lineTo(x0,y0+4);ctx.moveTo(x0+200*kmpx,y0-4);ctx.lineTo(x0+200*kmpx,y0+4);ctx.stroke();ctx.textAlign='center';ctx.fillText('200 km',x0+100*kmpx,y0+15);ctx.textAlign='left'}}
function drawSea(){const ctx=plane.sea.ctx;ctx.clearRect(0,0,FW,FH);ctx.fillStyle='#000';ctx.strokeStyle='#000';
  if(ship.track.length>1){ctx.lineWidth=1;ctx.beginPath();ship.track.forEach((c,i)=>{const [x,y]=pxf(...c);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
  for(const q of plank){const [x,y]=pxf(q.lon,q.lat);ctx.fillRect(x-1,y-1,2,2)}
  ctx.lineWidth=.8;for(const f of iron){const [x,y]=pxf(f.lon,f.lat);ctx.beginPath();ctx.arc(x,y,2.2,0,6.2832);ctx.stroke()}}
function drawCloud(){const ctx=plane.cloud.ctx;ctx.clearRect(0,0,FW,FH);ctx.fillStyle='#000';
  for(const c of clouds){const cx=clamp((c.x/CS)|0,0,CW-1),cy=clamp((c.y/CS)|0,0,CH-1),v=compose[cy*CW+cx];if(v>=CAL.length)continue;
    const k=CAL[v].cloud[cy*CW+cx];if(k<.3)continue;const n=2+((k*5)|0);
    for(let i=0;i<n;i++){const a=c.p+i*2.1,r=c.s*(.3+.7*hash(i,c.s*100|0));ctx.fillRect(c.x+Math.cos(a)*r,c.y+Math.sin(a)*r*.6,1.6,1.6)}}}
function drawInst(){const ctx=plane.inst.ctx;ctx.clearRect(0,0,FW,FH);ctx.fillStyle='#000';ctx.strokeStyle='#000';font(ctx,12);
  {const [x,y]=pxf(ship.lon,ship.lat);ctx.lineWidth=1.2;ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x-8,y+4);ctx.lineTo(x+8,y+4);ctx.lineTo(x+5,y-4);ctx.lineTo(x-5,y-4);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#000';ctx.fillText(ship.leg>=LEGS.length?'Ocean Pearl, home':'Ocean Pearl',x+12,y+4)}
  // Aqua: the afternoon pass sweeps the frame from east to west through the day; a solid line on a calendar day
  const frac=day%1,x=FW*(1-frac),on=CAL.find(e=>Math.abs(e.n-day)<.5);ctx.lineWidth=on?1.4:.7;ctx.setLineDash(on?[]:[6,6]);ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+40,FH);ctx.stroke();ctx.setLineDash([]);
  ctx.save();ctx.translate(x+6,16);ctx.fillText(on?'Aqua, pass of '+fmtS(on.date):'Aqua',0,0);ctx.restore()}
drawMap();

// ---------- camera (orthographic; rotations about z, then x, then y) ----------
const canvas=$('#c'),ctx=canvas.getContext('2d');let W=0,H=0,DPR=1;
const cam={ax:0,ay:0,az:0,zoom:1,px:0,py:0}, tgt={ax:0,ay:0,az:0};let view='top',parallax=true,mouse=[.5,.5];
function fit(){const r=$('#stage').getBoundingClientRect();const keep={...cam};Object.assign(cam,{ax:tgt.ax,ay:tgt.ay,az:tgt.az,zoom:1,px:0,py:0});M=rot();
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const z of [0,Z.inst])for(const [x,y] of [[0,0],[FW,0],[0,FH],[FW,FH]]){const [sx,sy]=proj(x,y,z);x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy)}
  const z=Math.min(r.width/(x1-x0),r.height/(y1-y0))*.9;Object.assign(cam,{ax:keep.ax,ay:keep.ay,az:keep.az,zoom:z,px:-((x0+x1)/2-W/2)*z,py:-((y0+y1)/2-H/2)*z});M=rot()}
function rot(){const cz=Math.cos(cam.az),sz=Math.sin(cam.az),cx=Math.cos(cam.ax),sx=Math.sin(cam.ax),cy=Math.cos(cam.ay),sy=Math.sin(cam.ay);
  // M = Ry·Rx·Rz
  const rz=[cz,-sz,0, sz,cz,0, 0,0,1], rx=[1,0,0, 0,cx,-sx, 0,sx,cx], ry=[cy,0,sy, 0,1,0, -sy,0,cy];
  const mul=(a,b)=>{const o=new Array(9).fill(0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)o[i*3+j]+=a[i*3+k]*b[k*3+j];return o};return mul(ry,mul(rx,rz))}
let M=rot();
function proj(x,y,z){const X=x-FW/2,Y=y-FH/2;return [W/2+cam.px+cam.zoom*(M[0]*X+M[1]*Y+M[2]*z), H/2+cam.py+cam.zoom*(M[3]*X+M[4]*Y+M[5]*z)]}
function affine(z){const p0=proj(0,0,z),p1=proj(FW,0,z),p2=proj(0,FH,z);return [(p1[0]-p0[0])/FW,(p1[1]-p0[1])/FW,(p2[0]-p0[0])/FH,(p2[1]-p0[1])/FH,p0[0],p0[1]]}
function unproj(sx,sy){const [a,b,c,d,e,f]=affine(0);const det=a*d-b*c;if(Math.abs(det)<1e-9)return null;const X=sx-e,Y=sy-f;return [(d*X-c*Y)/det,(-b*X+a*Y)/det]}
function setView(v){view=v;$('#v-top').setAttribute('aria-pressed',String(v==='top'));$('#v-iso').setAttribute('aria-pressed',String(v==='iso'));
  if(v==='iso'){tgt.ax=35.264*Math.PI/180;tgt.az=Math.PI/4;tgt.ay=0}else{tgt.ax=0;tgt.az=0;tgt.ay=0}fit()}
function tickCam(){if(view==='top'&&parallax){tgt.ax=(mouse[1]-.5)*-.16;tgt.ay=(mouse[0]-.5)*.16}
  for(const k of ['ax','ay','az'])cam[k]+=(tgt[k]-cam[k])*.08;M=rot()}

// ---------- frame ----------
function resize(){const r=$('#stage').getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;canvas.width=W*DPR;canvas.height=H*DPR;fit()}
function render(target,w,h,dpr){const c=target;c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle='#fff';c.fillRect(0,0,w,h);
  const order=['composite','grid','map','sea','cloud','inst'],tilted=Math.abs(cam.ax)+Math.abs(cam.ay)>.03;
  const NAME={composite:'Composite of days',grid:'',map:'Map',sea:'Sea surface',cloud:'Cloud deck',inst:'Instruments'};
  // corner posts from the ground plate to the highest visible plate
  if(tilted){const top=Math.max(...order.filter(k=>show[k]).map(k=>Z[k]));c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=.6;c.beginPath();for(const [x,y] of [[0,0],[FW,0],[0,FH],[FW,FH]]){const p0=proj(x,y,0),p1=proj(x,y,top);c.moveTo(...p0);c.lineTo(...p1)}c.stroke()}
  for(const k of order){if(!show[k])continue;const [a,b,cc,d,e,f]=affine(Z[k]);c.setTransform(a*dpr,b*dpr,cc*dpr,d*dpr,e*dpr,f*dpr);c.imageSmoothingQuality='high';c.drawImage(plane[k],0,0);
    if(k==='composite'||(tilted&&k!=='grid')){c.strokeStyle=k==='composite'?'#000':'rgba(0,0,0,.35)';c.lineWidth=(k==='composite'?1:.6)/cam.zoom;c.strokeRect(0,0,FW,FH)}
    c.setTransform(dpr,0,0,dpr,0,0);
    if(tilted&&NAME[k]){const [x,y]=proj(FW,0,Z[k]);c.fillStyle='#000';font(c,11);c.textAlign='left';c.fillText(NAME[k],x+8,y+4)}}
  c.setTransform(dpr,0,0,dpr,0,0)}
let last=0,n=0,acc=0,brushTick=0;
function frame(ts){const dt=Math.min(.05,(ts-last)/1000||.016);last=ts;
  if(running&&day<110){step(dt*2);$('#clock').value=day.toFixed(1);$('#v-day').textContent=Math.floor(day)}
  acc+=dt;if(acc>.4||(dirtyComposite&&!running)){acc=0;assign()}
  if(dirtyComposite)drawComposite();
  if(show.sea)drawSea();if(show.cloud)drawCloud();if(show.inst)drawInst();
  tickCam();render(ctx,W,H,DPR);
  if((n++%15)===0){readout();strip()}requestAnimationFrame(frame)}

// ---------- strip ----------
const stripEl=$('#strip');let brushDay=CAL.findIndex(e=>e.date==='2012-08-29');
stripEl.innerHTML=CAL.map((e,i)=>`<button class="d" data-i="${i}" aria-pressed="${i===brushDay}"><span class="u"><i></i></span><img src="cal/thumb/${e.date}.jpg" alt=""><span class="t">${fmtS(e.date)}</span><span class="s"></span></button>`).join('');
const stripBtns=$$('#strip .d');
stripBtns.forEach(b=>b.addEventListener('click',()=>{brushDay=+b.dataset.i;stripBtns.forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.i===brushDay)))}));
function strip(){let near=0;for(let i=1;i<CAL.length;i++)if(Math.abs(CAL[i].n-day)<Math.abs(CAL[near].n-day))near=i;
  stripBtns.forEach((b,i)=>{b.querySelector('.u i').style.height=(usage[i]*100)+'%';b.querySelector('.s').textContent=usage[i]>=.005?Math.round(usage[i]*100)+'%':'';b.classList.toggle('now',i===near)})}

// ---------- readout ----------
function readout(){const tot=(exported+respired)||1,e=exported/tot,used=usage.reduce((a,v)=>a+(v>0?1:0),0);
  $('#outbody').innerHTML=`<dl><dt>Day ${Math.floor(day)}</dt><dd>${fmt(day)}</dd>
   <dt>Iron in water</dt><dd>${iron.length?Math.round(iron.length*0.25)+' t':'spent'}</dd>
   <dt>Bloom area</dt><dd>${Math.round(area).toLocaleString()} km²</dd><div class="bar"><i style="width:${clamp(area/10000,0,1)*100}%"></i></div>
   <dt>Peak so far</dt><dd>${Math.round(peakArea).toLocaleString()} km²</dd>
   <dt>Reported 2012</dt><dd>~10,000 km²</dd>
   <dt>Carbon exported</dt><dd>${Math.round(e*100)}%</dd><div class="bar"><i style="width:${e*100}%"></i></div>
   <dt>Days in the picture</dt><dd>${used} of ${CAL.length}</dd>
   <dt>Cells</dt><dd>${blocks.length.toLocaleString()}</dd></dl>
   <p>Plankton ×${plank.length.toLocaleString()}. The witness weights decide which pass each cell shows: a cell with a dense bloom under it pulls the day whose chlorophyll was high there; a cell under simulated cloud pulls a cloudy day; the wake pulls the day nearest the ship's passing; the clock pulls the nearest date. <a href="https://map.geoengineeringmonitor.org/ggr/haida-salmon-restoration-corporation-(hsrc)" target="_blank" rel="noopener">Monitor record</a>.</p>`}

// ---------- tools ----------
let tool='move';const HINT={move:'Drag to pan, wheel to zoom, Alt-drag to turn the camera. F fits the frame; 1 and 2 switch the view.',paint:'Paint cells with the day selected in the strip. Right-click picks a day from the picture.',erase:'Return cells to the rule.',hide:'Blank cells to white.',pick:'Click the picture to pick its day for the brush.'};
function setTool(t){tool=t;$$('.tool').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tool===t)));$('#stage').className=t;$('#hint').textContent=HINT[t]}
$$('.tool').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));setTool('move');
$$('.box h3').forEach(h=>h.addEventListener('click',()=>h.parentElement.classList.toggle('folded')));
let brush=5;$('#brush').addEventListener('input',e=>{brush=+e.target.value;$('#v-brush').textContent=brush});
function pushHistory(){history.push(strokes.slice());if(history.length>40)history.shift()}
let drag=null;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;
  if(tool==='move'||e.altKey){drag={sx,sy,px:cam.px,py:cam.py,az:tgt.az,ax:tgt.ax,turn:e.altKey};return}
  const f=unproj(sx,sy);if(!f)return;
  if(tool==='pick'||e.button===2){const [cx,cy]=cellOf(...f);const v=compose[cy*CW+cx];if(v<CAL.length){brushDay=v;stripBtns.forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.i===brushDay)))}return}
  pushHistory();drag={paint:true,lastCell:null};paintAt(f)});
function paintAt(f){const [cx,cy]=cellOf(...f);const v=tool==='paint'?brushDay:tool==='erase'?UNPAINTED:HIDDEN;
  if(drag.lastCell){const [lx,ly]=drag.lastCell,n=Math.max(Math.abs(cx-lx),Math.abs(cy-ly));for(let i=1;i<=n;i++)stamp(Math.round(lx+(cx-lx)*i/n),Math.round(ly+(cy-ly)*i/n),brush/2,v)}else stamp(cx,cy,brush/2,v);
  drag.lastCell=[cx,cy];recompose();dirtyComposite=true}
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left,sy=e.clientY-r.top;mouse=[sx/W,sy/H];if(!drag)return;
  if(drag.paint){const f=unproj(sx,sy);if(f)paintAt(f);return}
  if(drag.turn){tgt.az=drag.az+(sx-drag.sx)*.01;tgt.ax=clamp(drag.ax+(sy-drag.sy)*.005,0,1.2);if(view==='top'){view='iso';$('#v-top').setAttribute('aria-pressed','false');$('#v-iso').setAttribute('aria-pressed','true')}}
  else{cam.px=drag.px+(sx-drag.sx);cam.py=drag.py+(sy-drag.sy)}});
canvas.addEventListener('pointerup',()=>{drag=null});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),sx=e.clientX-r.left-W/2,sy=e.clientY-r.top-H/2;const k=Math.exp(-e.deltaY*.0015);cam.px=sx-(sx-cam.px)*k;cam.py=sy-(sy-cam.py)*k;cam.zoom*=k},{passive:false});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;const k=e.key.toLowerCase();
  if(k==='m')setTool('move');else if(k==='b')setTool('paint');else if(k==='e')setTool('erase');else if(k==='h')setTool('hide');else if(k==='i')setTool('pick');
  else if(k==='f')fit();else if(k==='1')setView('top');else if(k==='2')setView('iso');else if(k==='['){brush=Math.max(1,brush-1);$('#brush').value=brush;$('#v-brush').textContent=brush}else if(k===']'){brush=Math.min(24,brush+1);$('#brush').value=brush;$('#v-brush').textContent=brush}
  else if(k===' '){e.preventDefault();$('#play').click()}else if(k==='z'&&(e.ctrlKey||e.metaKey)){e.preventDefault();$('#undo').click()}});
$('#v-top').addEventListener('click',()=>setView('top'));$('#v-iso').addEventListener('click',()=>setView('iso'));
$('#v-par').addEventListener('click',e=>{parallax=!parallax;e.target.setAttribute('aria-pressed',String(parallax));if(!parallax&&view==='top'){tgt.ax=0;tgt.ay=0}});
$('#play').addEventListener('click',e=>{running=!running;e.target.textContent=running?'Pause':'Run';e.target.setAttribute('aria-pressed',String(!running))});
$('#reset').addEventListener('click',()=>{reset();dirtyComposite=true});
$('#clock').addEventListener('input',e=>{const t=+e.target.value;if(t<day){reset()}while(day<t-.05)step(.5);$('#v-day').textContent=Math.floor(day);acc=1});
$('#clear').addEventListener('click',()=>{pushHistory();strokes.fill(UNPAINTED);recompose();dirtyComposite=true});
$('#undo').addEventListener('click',()=>{const h=history.pop();if(h){strokes.set(h);recompose();dirtyComposite=true}});
for(const k of ['iron','eddy','graze','wind']){$('#'+k).addEventListener('input',e=>{P[k]=+e.target.value;$('#v-'+k).textContent=k==='iron'?P.iron+' t':P[k].toFixed(2)})}
for(const k of ['bloom','sky','wake','clock']){$('#w-'+k).addEventListener('input',e=>{Wt[k]=+e.target.value;$('#v-w-'+k).textContent=Wt[k].toFixed(2);acc=1})}
const LVL=['256 × 128','128 × 64','64 × 32','32 × 16'];
$('#level').addEventListener('input',e=>{level=3-+e.target.value;$('#v-level').textContent=LVL[level];rule.fill(UNPAINTED);acc=1});
$('#refine').addEventListener('change',e=>{refine=e.target.checked;rule.fill(UNPAINTED);acc=1});
$$('.preset').forEach(b=>b.addEventListener('click',()=>{const w=b.dataset.w.split(',').map(Number);['bloom','sky','wake','clock'].forEach((k,i)=>{Wt[k]=w[i];$('#w-'+k).value=w[i];$('#v-w-'+k).textContent=w[i].toFixed(2)});acc=1}));
$$('[data-plane]').forEach(c=>c.addEventListener('change',()=>{show[c.dataset.plane]=c.checked}));
$$('.prod').forEach(b=>b.addEventListener('click',()=>{prod=b.dataset.prod;$$('.prod').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));dirtyComposite=true}));

// ---------- exports ----------
const dl=(name,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
const stamp8=()=>new Date().toISOString().slice(0,16).replace(/[-:T]/g,'');
$('#png').addEventListener('click',()=>{const k=Math.min(2,4096/Math.max(W,H));const c=oc(W*k,H*k);render(c.getContext('2d'),W,H,k);c.toBlob(b=>dl(`haida_${view}_day${Math.floor(day)}_${stamp8()}.png`,b),'image/png')});
$('#svg').addEventListener('click',()=>{const rects=blocks.filter(b=>b.v!==UNPAINTED).map(b=>`<rect x="${(b.x*CS).toFixed(2)}" y="${(b.y*CS).toFixed(2)}" width="${(b.w*CS).toFixed(2)}" height="${(b.h*CS).toFixed(2)}" data-day="${b.v<CAL.length?CAL[b.v].date:'hidden'}" fill="${b.v<CAL.length?'none':'#fff'}" stroke="#000" stroke-width="0.4"/>`).join('\n');
  const legend=CAL.map((e,i)=>`<text x="${20+i*90}" y="${FH+30}" font-size="10" font-family="ABC Diatype">${e.date} ${Math.round(usage[i]*100)}%</text>`).join('\n');
  const s=`<svg xmlns="http://www.w3.org/2000/svg" width="34in" height="17in" viewBox="0 0 ${FW} ${FH+50}"><g id="cells">\n${rects}\n</g><g id="legend">\n${legend}\n</g></svg>`;dl(`haida_cells_day${Math.floor(day)}_${stamp8()}.svg`,new Blob([s],{type:'image/svg+xml'}))});
const rle=a=>{const o=[];let v=a[0],n=0;for(const x of a){if(x===v)n++;else{o.push(v,n);v=x;n=1}}o.push(v,n);return o};
const unrle=(r,a)=>{let i=0;for(let j=0;j<r.length;j+=2){a.fill(r[j],i,i+r[j+1]);i+=r[j+1]}};
$('#save').addEventListener('click',()=>{const s={app:'haida-witness',version:1,site:'Haida Gwaii',calendar:CAL.map(e=>e.date),day,sim:{...P},witness:{...Wt},view,camera:{ax:tgt.ax,ay:tgt.ay,az:tgt.az,zoom:cam.zoom,px:cam.px,py:cam.py},product:prod,planes:{...show},strokes:rle(strokes),picture:rle(compose),cells:[CW,CH]};
  dl(`haida_setup_${stamp8()}.json`,new Blob([JSON.stringify(s)],{type:'application/json'}))});
$('#open').addEventListener('click',()=>$('#file').click());
$('#file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const s=JSON.parse(await f.text());
  if(s.sim)for(const k in P)if(k in s.sim){P[k]=s.sim[k];$('#'+k).value=P[k];$('#v-'+k).textContent=k==='iron'?P.iron+' t':P[k].toFixed(2)}
  if(s.witness)for(const k in Wt)if(k in s.witness){Wt[k]=s.witness[k];$('#w-'+k).value=Wt[k];$('#v-w-'+k).textContent=Wt[k].toFixed(2)}
  if(s.product){prod=s.product;$$('.prod').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.prod===prod)))}
  if(s.planes)for(const k in show)if(k in s.planes){show[k]=s.planes[k];const c=$(`[data-plane="${k}"]`);if(c)c.checked=show[k]}
  const map=s.calendar?s.calendar.map(d=>CAL.findIndex(e=>e.date===d)):null;
  if(s.strokes){unrle(s.strokes,strokes);if(map)for(let i=0;i<strokes.length;i++){const v=strokes[i];if(v<map.length)strokes[i]=map[v]<0?UNPAINTED:map[v]}}
  reset();const t=+s.day||0;while(day<t-.05)step(.5);$('#clock').value=day.toFixed(1);
  if(s.view)setView(s.view);if(s.camera){Object.assign(tgt,{ax:s.camera.ax,ay:s.camera.ay,az:s.camera.az});cam.zoom=s.camera.zoom;cam.px=s.camera.px;cam.py=s.camera.py}
  acc=1;dirtyComposite=true;e.target.value=''});

addEventListener('resize',resize);resize();
if(matchMedia('(prefers-reduced-motion: reduce)').matches)running=false;
assign();requestAnimationFrame(frame);
window.__hw={CAL,rule,strokes,compose,blocksRef:()=>blocks,cam,tgt,setView,assign,step:(d)=>{while(day<d)step(.5)},get day(){return day},Wt,P,usage};
})().catch(e=>{document.getElementById('out').textContent='Could not load imagery: '+e;console.error(e)});
