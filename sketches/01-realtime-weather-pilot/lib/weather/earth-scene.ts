import * as THREE from 'three';
import {
  earthPoint,
  elevationAt,
  reliefGeometry,
  EARTH_METRES,
} from './earth-geometry';
import { analyticWind, sampleGrid } from './simulation';
import { geography } from './case-study';
import { cloudHeightGeometry } from './cloud-height';
import type { EarthInspection } from './earth-inspection';
import type { GlobeProps } from '@/components/weather/globe';
import { cameraTilt, cameraHeading } from './navigation';
import { publicUrl } from './public-url';
import { inTerrainRegion, regionalTerrain } from './terrain-catalog';
import type { createTerrainTiles } from './terrain-tiles';

const vertex = `varying vec2 vUv; varying vec3 vNormal; varying vec3 vPosition;
void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const navigation = `
vec3 navigate(vec3 p){
 float lat=asin(normalize(p).y),lon=atan(p.x,p.z)+radians(75.0);
 float req=6378137.,rp=6356752.31414,H=42164160.;
 float c=atan(rp*rp/(req*req)*tan(lat));
 float rc=rp/sqrt(1.-(1.-rp*rp/(req*req))*cos(c)*cos(c));
 float px=rc*cos(c)*cos(lon),py=rc*cos(c)*sin(lon),pz=rc*sin(c),sx=H-px;
 float visible=step(px*px+py*py+req*req/(rp*rp)*pz*pz,H*px);
 float x=asin(py/length(vec3(sx,py,pz))),y=atan(pz/sx);
 return vec3(.5+x/.303744,.5+y/.303744,visible);
}`;

export function createEarthScene(
  canvas: HTMLCanvasElement,
  onError: (value: string) => void,
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor('#fafaf7');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(36, 1, 0.000001, 12);
  const ambient = new THREE.AmbientLight(0xffffff, 1.25),
    sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-3, 5, 5);
  scene.add(ambient, sun);
  let alive = true,
    grid: Int16Array | null = null,
    width = 1,
    height = 1,
    lastScale = -1,
    lastDepthScale = -1;
  const loader = new THREE.TextureLoader();
  let terrainTiles: ReturnType<typeof createTerrainTiles> | null = null,
    terrainLoading = false,
    lastTerrainReport = 0,
    smoothedDatum: number | null = null;
  const earth = loader.load(
    publicUrl('/data/earth-january-2004.jpg'),
    undefined,
    undefined,
    () => onError('Earth image unavailable'),
  );
  earth.colorSpace = THREE.SRGBColorSpace;
  earth.anisotropy = 4;
  const aerial = loader.load(
    publicUrl('/data/archive/earth/manhattan-naip.jpg'),
    undefined,
    undefined,
    () => onError('Local aerial imagery unavailable'),
  );
  aerial.colorSpace = THREE.SRGBColorSpace;
  aerial.anisotropy = 4;
  const groundMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    uniforms: {
      earth: { value: earth },
      cutCity: { value: false },
      cutRegion: { value: false },
    },
    fragmentShader: `
    uniform sampler2D earth;uniform bool cutCity,cutRegion; varying vec2 vUv;varying vec3 vNormal;varying vec3 vPosition;
    void main(){if(cutCity){float lo=vUv.x*360.-180.,la=vUv.y*180.-90.;if(lo>-74.024&&lo<-74.0&&la>40.699&&la<40.717)discard;}vec3 rgb=texture2D(earth,vUv).rgb;
      if(cutRegion){float lo=degrees(atan(vPosition.x,vPosition.z)),la=degrees(asin(normalize(vPosition).y));if(lo> -121.98&&lo< -121.55&&la>46.72&&la<47.0)discard;}
      float e=length(vPosition)-1.;
      if(e<-.000005) rgb=mix(vec3(.045,.11,.16),vec3(.3,.52,.58),exp(e*65.));
      float light=.6+.4*max(0.,dot(normalize(vNormal),normalize(vec3(-.4,.7,1.))));
      gl_FragColor=vec4(rgb*light,1.);
      #include <colorspace_fragment>
    }`,
  });
  const ground = new THREE.Mesh(reliefGeometry(null, 1), groundMaterial);
  scene.add(ground);
  const ocean = new THREE.Mesh(
    new THREE.SphereGeometry(1, 160, 80),
    new THREE.MeshBasicMaterial({
      color: 0x9ac6d0,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    }),
  );
  ocean.renderOrder = 2;
  scene.add(ocean);
  const satelliteMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    transparent: true,
    depthWrite: false,
    uniforms: { source: { value: null }, opacity: { value: 0.9 } },
    fragmentShader: `
    uniform sampler2D source;uniform float opacity;varying vec3 vPosition;${navigation}
    void main(){vec3 q=navigate(vPosition);if(q.z<.5||q.y<.024||q.y>.995)discard;
      vec3 rgb=texture2D(source,q.xy).rgb;
      gl_FragColor=vec4(rgb,opacity);
      #include <colorspace_fragment>
    }`,
  });
  const satellite = new THREE.Mesh(ground.geometry.clone(), satelliteMaterial);
  satellite.renderOrder = 3;
  scene.add(satellite);
  const retrievedCloud = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }),
  );
  scene.add(retrievedCloud);
  let lastRetrieved: GlobeProps['retrievedCloud'] = null,
    lastRetrievedScale = -1;
  const cloudMaterial = new THREE.ShaderMaterial({
    vertexShader: vertex,
    transparent: true,
    depthWrite: false,
    uniforms: {
      source: { value: null },
      previous: { value: null },
      frameBlend: { value: 1 },
      opacity: { value: 0 },
      cutoff: { value: 0.5 },
      softness: { value: 0.7 },
      cloudOnly: { value: true },
    },
    fragmentShader: `
    uniform sampler2D source,previous;uniform float opacity,cutoff,softness,frameBlend;uniform bool cloudOnly;varying vec2 vUv;
    vec4 cloudAt(sampler2D image,vec2 uv){vec4 c=texture2D(image,uv);float b=dot(c.rgb,vec3(.2126,.7152,.0722));float a=c.a;
      if(cloudOnly){float spread=mix(.06,.42,softness);a*=smoothstep(max(0.,cutoff-spread),min(1.,cutoff+spread),b);float chroma=max(max(c.r,c.g),c.b)-min(min(c.r,c.g),c.b);a*=1.-smoothstep(.1,.38,chroma);c.rgb=vec3(b);}
      return vec4(c.rgb*a,a);}
    vec4 sampleCloud(sampler2D image,vec2 uv){vec2 d=vec2(1./2048.,1./1024.)*softness*1.6;return cloudAt(image,uv)*.4+(cloudAt(image,uv+vec2(d.x,0.))+cloudAt(image,uv-vec2(d.x,0.))+cloudAt(image,uv+vec2(0.,d.y))+cloudAt(image,uv-vec2(0.,d.y)))*.15;}
    void main(){vec4 c=sampleCloud(source,vUv);if(frameBlend<1.)c=mix(sampleCloud(previous,vUv),c,frameBlend);gl_FragColor=vec4(c.rgb/max(c.a,.00001),c.a*opacity);
      #include <colorspace_fragment>
    }`,
  });
  const clouds = new THREE.Mesh(reliefGeometry(null, 0), cloudMaterial);
  clouds.renderOrder = 4;
  scene.add(clouds);
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1, 100, 50),
    new THREE.ShaderMaterial({
      vertexShader: vertex,
      transparent: true,
      depthWrite: false,
      uniforms: {},
      fragmentShader: `varying vec3 vNormal;void main(){float rim=pow(1.-abs(normalize(vNormal).z),3.);gl_FragColor=vec4(.4,.65,.82,rim*.11);}`,
    }),
  );
  atmosphere.renderOrder = 5;
  scene.add(atmosphere);
  const coast = new THREE.Group(),
    borders = new THREE.Group(),
    graticule = new THREE.Group(),
    sites = new THREE.Group(),
    winds = new THREE.Group(),
    caseLayer = new THREE.Group(),
    buildings = new THREE.Group(),
    citySurface = new THREE.Group();
  scene.add(
    coast,
    borders,
    graticule,
    sites,
    winds,
    caseLayer,
    buildings,
    citySurface,
  );
  coast.renderOrder = 6;
  borders.renderOrder = 6;
  graticule.renderOrder = 6;
  const ownedTextures = new Set<THREE.Texture>([earth, aerial]);
  let sourceImage: HTMLImageElement | null = null,
    cloudImage: HTMLImageElement | null = null,
    transitionStart = 0;
  const siteObjects: THREE.Object3D[] = [];
  let coastPaths: number[][][] = [],
    borderPaths: number[][][] = [],
    buildingData: {
      id: number;
      name: string;
      height: number;
      heightMethod: string;
      ring: number[][];
    }[] = [];
  const wallIds: number[] = [],
    roofIds: number[] = [];
  const clear = (group: THREE.Group) => {
    for (const obj of group.children.slice()) {
      group.remove(obj);
      obj.traverse((o) => {
        if (o instanceof THREE.Sprite) o.material.map?.dispose();
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        if (m.material) {
          for (const mat of Array.isArray(m.material)
            ? m.material
            : [m.material])
            mat.dispose();
        }
      });
    }
  };
  const surfacePoint = (lon: number, lat: number, lift = 0) =>
    earthPoint(
      lon,
      lat,
      Math.max(0, elevationAt(grid, lon, lat)) * Math.max(0, lastScale) + lift,
    );
  const paths = (
    group: THREE.Group,
    lines: number[][][],
    color: number,
    opacity = 1,
  ) => {
    const points: number[] = [];
    for (const line of lines)
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1],
          b = line[i];
        if (Math.abs(a[0] - b[0]) > 180) continue;
        points.push(
          ...surfacePoint(a[0], a[1], 1400).toArray(),
          ...surfacePoint(b[0], b[1], 1400).toArray(),
        );
      }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    );
    group.add(
      new THREE.LineSegments(
        geometry,
        new THREE.LineBasicMaterial({
          color,
          transparent: opacity < 1,
          opacity,
          depthWrite: false,
        }),
      ),
    );
  };
  function rebuild(scale: number) {
    lastScale = scale;
    ground.geometry.dispose();
    ground.geometry = reliefGeometry(grid, scale);
    satellite.geometry.dispose();
    satellite.geometry = ground.geometry.clone();
    const p = satellite.geometry.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.setLength(Math.max(1, v.length()) + 0.0003);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    p.needsUpdate = true;
    clear(coast);
    clear(borders);
    clear(graticule);
    clear(caseLayer);
    paths(coast, coastPaths, 0xffffff, 0.9);
    paths(borders, borderPaths, 0xffffff, 0.7);
    const lines: number[][][] = [];
    for (let lat = -75; lat <= 75; lat += 15)
      lines.push(Array.from({ length: 361 }, (_, i) => [i - 180, lat]));
    for (let lon = -180; lon < 180; lon += 15)
      lines.push(Array.from({ length: 181 }, (_, i) => [lon, i - 90]));
    paths(graticule, lines, 0x9dacac, 0.4);
    for (const river of geography.rivers) {
      const g = river.geometry;
      paths(
        caseLayer,
        (g.type === 'LineString'
          ? [g.coordinates]
          : g.coordinates) as number[][][],
        0x8ddfe5,
        0.8,
      );
    }
    const places = new THREE.BufferGeometry();
    places.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        geography.places.flatMap((p) =>
          surfacePoint(p.longitude, p.latitude, 1600).toArray(),
        ),
        3,
      ),
    );
    caseLayer.add(
      new THREE.Points(
        places,
        new THREE.PointsMaterial({
          color: 0xffffff,
          size: 4,
          sizeAttenuation: false,
          depthWrite: false,
        }),
      ),
    );
  }
  function buildFabric() {
    clear(buildings);
    clear(citySurface);
    wallIds.length = 0;
    roofIds.length = 0;
    const coords: number[] = [],
      colors: number[] = [],
      roofCoords: number[] = [],
      roofUv: number[] = [];
    for (const item of buildingData) {
      const ring = item.ring.slice(0, -1),
        points = ring.map((p) => new THREE.Vector2(p[0], p[1]));
      const triangles = THREE.ShapeUtils.triangulateShape(points, []);
      // Local built-fabric sample uses a flat 0m datum: coarse ETOPO is not street-level terrain.
      const low = ring.map((p) => earthPoint(p[0], p[1], 0)),
        high = ring.map((p) => earthPoint(p[0], p[1], item.height));
      const push = (
        a: THREE.Vector3,
        b: THREE.Vector3,
        c: THREE.Vector3,
        shade: number,
      ) => {
        wallIds.push(item.id);
        coords.push(...a.toArray(), ...b.toArray(), ...c.toArray());
        for (let n = 0; n < 3; n++) colors.push(shade, shade, shade);
      };
      for (const t of triangles) {
        roofIds.push(item.id);
        for (const i of t) {
          roofCoords.push(...high[i].toArray());
          roofUv.push(
            (ring[i][0] + 74.024) / 0.024,
            (ring[i][1] - 40.699) / 0.018,
          );
        }
      }
      for (let i = 0; i < ring.length; i++) {
        const j = (i + 1) % ring.length;
        push(low[i], low[j], high[j], 0.43);
        push(low[i], high[j], high[i], 0.43);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(coords, 3),
    );
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    geometry.userData.buildingIds = wallIds;
    buildings.add(
      new THREE.Mesh(
        geometry,
        new THREE.MeshLambertMaterial({
          vertexColors: true,
          side: THREE.DoubleSide,
        }),
      ),
    );
    const roofs = new THREE.BufferGeometry();
    roofs.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(roofCoords, 3),
    );
    roofs.setAttribute('uv', new THREE.Float32BufferAttribute(roofUv, 2));
    roofs.userData.buildingIds = roofIds;
    buildings.add(
      new THREE.Mesh(
        roofs,
        new THREE.MeshBasicMaterial({ map: aerial, side: THREE.DoubleSide }),
      ),
    );
    const edges = new THREE.EdgesGeometry(geometry, 35);
    buildings.add(
      new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x22282a }),
      ),
    );
    // A bounded 1.6 km cartographic datum under the footprints, not fabricated ground relief.
    const local = new THREE.BufferGeometry(),
      positions: number[] = [],
      uv: number[] = [],
      indices: number[] = [];
    for (let j = 0; j <= 16; j++)
      for (let i = 0; i <= 16; i++) {
        positions.push(
          ...earthPoint(
            -74.024 + (i / 16) * 0.024,
            40.717 - (j / 16) * 0.018,
            -0.5,
          ).toArray(),
        );
        uv.push(i / 16, 1 - j / 16);
      }
    for (let j = 0; j < 16; j++)
      for (let i = 0; i < 16; i++) {
        const a = j * 17 + i,
          b = a + 17;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    local.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    local.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    local.setIndex(indices);
    citySurface.add(
      new THREE.Mesh(
        local,
        new THREE.MeshBasicMaterial({ map: aerial, side: THREE.DoubleSide }),
      ),
    );
  }
  const get = <T>(url: string): Promise<T> =>
    fetch(publicUrl(url)).then((r) => {
      if (!r.ok) throw Error(url);
      return r.json() as Promise<T>;
    });
  get<{
    features: {
      geometry: { type: string; coordinates: number[][][] | number[][][][] };
    }[];
  }>('/data/land.geojson')
    .then((data) => {
      if (!alive) return;
      coastPaths = data.features.flatMap(
        (f: {
          geometry: {
            type: string;
            coordinates: number[][][] | number[][][][];
          };
        }) =>
          f.geometry.type === 'Polygon'
            ? [(f.geometry.coordinates as number[][][])[0]]
            : (f.geometry.coordinates as number[][][][]).map((p) => p[0]),
      );
      rebuild(lastScale);
    })
    .catch(() => onError('Coastline archive unavailable'));
  get<{
    features: {
      geometry: { type: string; coordinates: number[][] | number[][][] };
    }[];
  }>('/data/boundaries.geojson')
    .then((data) => {
      if (!alive) return;
      borderPaths = data.features.flatMap(
        (f: {
          geometry: { type: string; coordinates: number[][] | number[][][] };
        }) =>
          f.geometry.type === 'LineString'
            ? [f.geometry.coordinates as number[][]]
            : (f.geometry.coordinates as number[][][]),
      );
      rebuild(lastScale);
    })
    .catch(() => onError('Boundary archive unavailable'));
  fetch(publicUrl('/data/archive/earth/elevation.i16'))
    .then((r) => {
      if (!r.ok) throw Error();
      return r.arrayBuffer();
    })
    .then((data) => {
      if (!alive) return;
      grid = new Int16Array(data);
      rebuild(Math.max(0, lastScale));
    })
    .catch(() => onError('Relief unavailable: showing reference sphere'));
  get<typeof buildingData>('/data/archive/earth/buildings.json')
    .then((data) => {
      if (!alive) return;
      buildingData = data;
      buildFabric();
    })
    .catch(() => onError('Building archive unavailable'));
  const particleGeometry = new THREE.BufferGeometry();
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 2,
    sizeAttenuation: false,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);
  const baselineGeometry = new THREE.BufferGeometry();
  const baseline = new THREE.Points(
    baselineGeometry,
    new THREE.PointsMaterial({
      color: 0x6acbdf,
      size: 2,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  scene.add(baseline);
  const trailGeometry = new THREE.BufferGeometry();
  const trails = new THREE.LineSegments(
    trailGeometry,
    new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
  );
  scene.add(trails);
  let lastSnapshot: GlobeProps['snapshot'] = null,
    lastBaseline: GlobeProps['baseline'] = null,
    siteKey = '',
    windKey = '';
  function updatePoints(
    geometry: THREE.BufferGeometry,
    snapshot: GlobeProps['snapshot'],
    scale: number,
  ) {
    const a: number[] = [];
    if (snapshot)
      for (let i = 0; i < snapshot.positions.length; i += 3) {
        if (!snapshot.positions[i + 2]) continue;
        a.push(
          ...earthPoint(
            snapshot.positions[i],
            snapshot.positions[i + 1],
            (snapshot.heights?.[i / 3] ?? 0) * scale,
          ).toArray(),
        );
      }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    geometry.computeBoundingSphere();
  }
  function updateSites(state: GlobeProps) {
    clear(sites);
    siteObjects.length = 0;
    state.sites.forEach((s, i) => {
      const point = surfacePoint(s.longitude, s.latitude, 2500);
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.004),
        new THREE.MeshBasicMaterial({
          color: i === state.selectedSite ? 0xf0e785 : 0xf2f5f5,
        }),
      );
      marker.position.copy(point);
      marker.userData.site = i;
      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 512;
      labelCanvas.height = 64;
      const context = labelCanvas.getContext('2d')!;
      context.fillStyle = 'rgba(250,250,247,.92)';
      context.fillRect(0, 0, 512, 64);
      context.font = '400 30px "Libre Franklin", Arial';
      context.fillStyle = '#151c20';
      context.fillText(s.label.toUpperCase(), 14, 43);
      const labelTexture = new THREE.CanvasTexture(labelCanvas);
      labelTexture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: labelTexture, depthWrite: false }),
      );
      label.scale.set(0.44, 0.055, 1);
      label.position.set(0.23, 0.045, 0);
      marker.add(label);
      sites.add(marker);
      siteObjects.push(marker);
    });
    for (const [a, b] of state.connections) {
      const first = state.sites[a],
        last = state.sites[b];
      if (!first || !last) continue;
      const curve: number[] = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50;
        const p = earthPoint(first.longitude, first.latitude)
          .lerp(earthPoint(last.longitude, last.latitude), t)
          .normalize()
          .multiplyScalar(1 + 0.1 * Math.sin(t * Math.PI));
        curve.push(...p.toArray());
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(curve, 3));
      sites.add(
        new THREE.Line(
          g,
          new THREE.LineBasicMaterial({
            color: 0xdee4e7,
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          }),
        ),
      );
    }
  }
  return {
    resize(w: number, h: number) {
      width = w;
      height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    draw(
      state: GlobeProps,
      lon: number,
      lat: number,
      zoom: number,
      heading = 0,
      tilt = 35,
    ) {
      const tileActive =
        state.detailEnabled &&
        state.terrainVisible &&
        !state.fabricFocus &&
        !state.goesEnabled &&
        !state.retrievedCloudVisible &&
        inTerrainRegion(lon, lat, 2) &&
        zoom > 8;
      if (tileActive && !terrainTiles && !terrainLoading) {
        terrainLoading = true;
        import('./terrain-tiles')
          .then(({ createTerrainTiles }) => {
            if (alive)
              terrainTiles = createTerrainTiles(scene, camera, renderer);
          })
          .catch(() => {
            onError('Regional terrain renderer unavailable');
          });
      }
      const scale = state.fabricFocus
        ? 0
        : state.terrainVisible
          ? state.terrainScale
          : 0;
      const scaleChanged = lastScale !== scale,
        depthChanged = lastDepthScale !== state.depthScale;
      lastDepthScale = state.depthScale;
      if (scaleChanged) rebuild(scale);
      renderer.setClearColor(state.lightBackground ? '#fafaf7' : '#090b0c');
      const radial = earthPoint(lon, lat).normalize();
      const distance =
        (2.6 / zoom) * (zoom < 4 ? Math.max(1, 1 / camera.aspect) : 1);
      camera.near = Math.max(0.0000001, distance / 100);
      camera.far = 8;
      camera.updateProjectionMatrix();
      const pivot = zoom > 4 ? 1 : Math.max(0, (zoom - 1) / 3);
      const localHeight = state.fabricFocus
        ? 0
        : ((tileActive ? terrainTiles?.elevation(lon, lat) : null) ??
          elevationAt(grid, lon, lat) * scale);
      const datum =
        1 +
        (state.oceanOpacity < 0.5 ? localHeight : Math.max(0, localHeight)) /
          EARTH_METRES;
      smoothedDatum =
        smoothedDatum === null
          ? datum
          : smoothedDatum + (datum - smoothedDatum) * 0.12;
      const target = radial.clone().multiplyScalar(pivot * smoothedDatum);
      const north = new THREE.Vector3(0, 1, 0)
        .addScaledVector(radial, -radial.y)
        .normalize();
      const east = new THREE.Vector3().crossVectors(north, radial).normalize();
      const angle = (cameraHeading(zoom, heading) * Math.PI) / 180,
        pitch = cameraTilt(zoom, tilt);
      const horizontal = north
        .clone()
        .multiplyScalar(-Math.cos(angle))
        .addScaledVector(east, Math.sin(angle));
      camera.position
        .copy(radial)
        .multiplyScalar(smoothedDatum + distance * Math.cos(pitch))
        .addScaledVector(horizontal, distance * Math.sin(pitch));
      camera.up
        .copy(north)
        .multiplyScalar(Math.cos(angle))
        .addScaledVector(east, -Math.sin(angle));
      if (tileActive && terrainTiles) {
        const p = camera.position,
          lo = (Math.atan2(p.x, p.z) * 180) / Math.PI,
          la = (Math.asin(p.y / p.length()) * 180) / Math.PI,
          h = terrainTiles.elevation(lo, la);
        if (h !== null && p.length() < 1 + (h + 20) / EARTH_METRES)
          p.setLength(1 + (h + 20) / EARTH_METRES);
      }
      camera.lookAt(target);
      camera.updateMatrixWorld();
      const terrainStatus = terrainTiles?.update(tileActive);
      if (performance.now() - lastTerrainReport > 500) {
        lastTerrainReport = performance.now();
        state.onTerrainStatus(
          terrainStatus ?? {
            active: tileActive,
            loaded: 0,
            visible: 0,
            level: 0,
            loading: tileActive,
            error: '',
          },
        );
      }
      ground.visible = true;
      groundMaterial.uniforms.cutCity.value = false;
      groundMaterial.uniforms.cutRegion.value = Boolean(
        tileActive && terrainTiles?.ready,
      );
      ocean.visible = state.oceanVisible && !state.fabricFocus;
      (ocean.material as THREE.MeshBasicMaterial).opacity = state.oceanOpacity;
      coast.visible = state.coastVisible && !state.fabricFocus;
      borders.visible = state.bordersVisible && !state.fabricFocus;
      graticule.visible = state.gridVisible && !state.fabricFocus;
      caseLayer.visible = state.caseGeography && !state.fabricFocus;
      buildings.visible = state.buildingsVisible;
      citySurface.visible = state.fabricFocus;
      satellite.visible =
        !!state.goesImage &&
        state.goesEnabled &&
        !state.fabricFocus &&
        !state.retrievedCloudVisible;
      retrievedCloud.visible =
        state.retrievedCloudVisible &&
        !!state.retrievedCloud &&
        !state.fabricFocus;
      if (
        retrievedCloud.visible &&
        (lastRetrieved !== state.retrievedCloud ||
          lastRetrievedScale !== state.retrievedCloudScale)
      ) {
        retrievedCloud.geometry.dispose();
        retrievedCloud.geometry = cloudHeightGeometry(
          state.retrievedCloud!,
          state.retrievedCloudScale,
        );
        lastRetrieved = state.retrievedCloud;
        lastRetrievedScale = state.retrievedCloudScale;
      }
      satellite.scale.setScalar(
        1 + (state.satelliteLiftKm * 1000 * state.depthScale) / EARTH_METRES,
      );
      satelliteMaterial.uniforms.opacity.value = state.goesOpacity;
      if (state.goesImage !== sourceImage) {
        (
          satelliteMaterial.uniforms.source.value as THREE.Texture | null
        )?.dispose();
        sourceImage = state.goesImage;
        if (sourceImage) {
          const texture = new THREE.Texture(sourceImage);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          satelliteMaterial.uniforms.source.value = texture;
        }
      }
      clouds.visible =
        !!state.observationImage &&
        !state.goesEnabled &&
        !state.fabricFocus &&
        !state.retrievedCloudVisible;
      if (state.observationImage !== cloudImage) {
        (
          cloudMaterial.uniforms.previous.value as THREE.Texture | null
        )?.dispose();
        cloudMaterial.uniforms.previous.value =
          cloudMaterial.uniforms.source.value;
        transitionStart =
          state.observationPlaying &&
          cloudImage &&
          state.observationImage &&
          state.observationImage.src > cloudImage.src
            ? performance.now()
            : 0;
        cloudImage = state.observationImage;
        if (cloudImage) {
          const texture = new THREE.Texture(cloudImage);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;
          cloudMaterial.uniforms.source.value = texture;
        }
      }
      clouds.scale.setScalar(
        1 +
          (state.cloudOnly
            ? state.cloudHeightKm * 1000 * state.cloudScale
            : 1500) /
            EARTH_METRES,
      );
      cloudMaterial.uniforms.opacity.value = state.observationOpacity;
      cloudMaterial.uniforms.cutoff.value = state.cloudThreshold;
      cloudMaterial.uniforms.softness.value = state.cloudSoftness;
      cloudMaterial.uniforms.cloudOnly.value = state.cloudOnly;
      if (!state.observationPlaying) transitionStart = 0;
      const blend = transitionStart
        ? Math.min(1, (performance.now() - transitionStart) / 1400)
        : 1;
      cloudMaterial.uniforms.frameBlend.value = blend * blend * (3 - 2 * blend);
      atmosphere.visible = state.atmosphereVisible && !state.fabricFocus;
      atmosphere.scale.setScalar(1 + (12000 * state.depthScale) / EARTH_METRES);
      const nextSiteKey = JSON.stringify([
        state.sites,
        state.selectedSite,
        scale,
      ]);
      if (nextSiteKey !== siteKey) {
        siteKey = nextSiteKey;
        updateSites(state);
      }
      sites.visible = state.placesVisible && !state.fabricFocus;
      for (const marker of siteObjects)
        marker.scale.setScalar(Math.max(0.002, 1 / Math.max(1, zoom * 0.5)));
      const placed: { x: number; y: number }[] = [];
      for (const marker of [...siteObjects].sort(
        (a, b) =>
          Number(b.userData.site === state.selectedSite) -
          Number(a.userData.site === state.selectedSite),
      )) {
        const label = marker.children[0];
        if (!label) continue;
        const p = marker.position.clone().project(camera),
          x = ((p.x + 1) * width) / 2,
          y = ((1 - p.y) * height) / 2;
        label.visible =
          (zoom > 3 || marker.userData.site === state.selectedSite) &&
          p.z < 1 &&
          !placed.some(
            (a) => Math.abs(a.x - x) < 180 && Math.abs(a.y - y) < 35,
          );
        if (label.visible) placed.push({ x, y });
      }
      if (lastSnapshot !== state.snapshot || scaleChanged || depthChanged) {
        lastSnapshot = state.snapshot;
        updatePoints(particleGeometry, state.snapshot, state.depthScale);
        const lines: number[] = [];
        const s = state.snapshot;
        if (s?.trails)
          for (let n = 120; n < s.trails.length; n += 2) {
            const a = n - 120;
            lines.push(
              ...earthPoint(
                s.trails[a],
                s.trails[a + 1],
                (s.trailHeights?.[a / 2] ?? 0) * state.depthScale,
              ).toArray(),
              ...earthPoint(
                s.trails[n],
                s.trails[n + 1],
                (s.trailHeights?.[n / 2] ?? 0) * state.depthScale,
              ).toArray(),
            );
          }
        trailGeometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(lines, 3),
        );
        trailGeometry.computeBoundingSphere();
      }
      if (lastBaseline !== state.baseline || scaleChanged || depthChanged) {
        lastBaseline = state.baseline;
        updatePoints(baselineGeometry, state.baseline, state.depthScale);
      }
      const nextWindKey = JSON.stringify([
        state.contribution,
        state.depthScale,
        state.samplesVisible,
      ]);
      if (windKey !== nextWindKey) {
        windKey = nextWindKey;
        clear(winds);
        const points: number[] = [];
        const g = state.contribution.grid;
        const nodes: number[][] = [];
        if (g) {
          for (let j = 0; j < g.height; j++)
            for (let i = 0; i < g.width; i++)
              nodes.push([g.west + i * g.dx, g.south + j * g.dy]);
        } else {
          for (let la = -70; la <= 70; la += 7)
            for (let lo = -180; lo < 180; lo += 7) nodes.push([lo, la]);
        }
        for (const [lo, la] of nodes) {
          const uv = g
            ? sampleGrid(g, lo, la)
            : analyticWind(lo, la, state.contribution.parameters);
          if (!uv) continue;
          const k = g ? state.contribution.parameters.wind / 18 : 1,
            h =
              (state.contribution.parameters.releaseHeight ?? 0) *
              state.depthScale;
          points.push(
            ...earthPoint(lo, la, h).toArray(),
            ...earthPoint(
              lo + uv[0] * k * 0.025,
              la + uv[1] * k * 0.025,
              h,
            ).toArray(),
          );
        }
        const geom = new THREE.BufferGeometry();
        geom.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(points, 3),
        );
        winds.add(
          new THREE.LineSegments(
            geom,
            new THREE.LineBasicMaterial({
              color: 0xdbeabb,
              transparent: true,
              opacity: 0.8,
              depthWrite: false,
            }),
          ),
        );
      }
      winds.visible =
        (state.windVisible || state.samplesVisible) &&
        !state.fabricFocus &&
        state.transportVisible;
      particles.visible =
        trails.visible =
        baseline.visible =
          !state.fabricFocus && state.transportVisible;
      renderer.render(scene, camera);
    },
    hit(x: number, y: number): number | EarthInspection | undefined {
      const ray = new THREE.Raycaster();
      ray.setFromCamera(
        new THREE.Vector2((x / width) * 2 - 1, 1 - (y / height) * 2),
        camera,
      );
      const all = ray.intersectObjects(
        [
          ...(ground.visible ? [ground] : []),
          ...(sites.visible ? siteObjects : []),
          ...(citySurface.visible ? citySurface.children : []),
          ...(buildings.visible
            ? buildings.children.filter((o) => o instanceof THREE.Mesh)
            : []),
          ...(retrievedCloud.visible ? [retrievedCloud] : []),
          ...(terrainTiles?.group.visible ? [terrainTiles.group] : []),
        ],
        false,
      );
      const hit = all.find((h) => {
        if (h.object === ground && groundMaterial.uniforms.cutRegion.value) {
          const lo = (Math.atan2(h.point.x, h.point.z) * 180) / Math.PI,
            la = (Math.asin(h.point.y / h.point.length()) * 180) / Math.PI;
          if (inTerrainRegion(lo, la)) return false;
        }
        if (h.object !== ground || !citySurface.visible) return true;
        const lon = (Math.atan2(h.point.x, h.point.z) * 180) / Math.PI,
          lat = (Math.asin(h.point.y / h.point.length()) * 180) / Math.PI;
        return !(lon > -74.024 && lon < -74 && lat > 40.699 && lat < 40.717);
      });
      if (!hit) return;
      if (typeof hit.object.userData.site === 'number')
        return hit.object.userData.site;
      const longitude = (Math.atan2(hit.point.x, hit.point.z) * 180) / Math.PI,
        latitude =
          (Math.asin(hit.point.y / hit.point.length()) * 180) / Math.PI;
      const ids = (hit.object as THREE.Mesh).geometry.userData.buildingIds as
        | number[]
        | undefined;
      const building =
        ids && buildingData.find((b) => b.id === ids[hit.faceIndex ?? 0]);
      if (hit.object.userData.regionalTerrain) {
        const value = terrainTiles?.elevation(longitude, latitude);
        if (value !== null && value !== undefined)
          return {
            longitude,
            latitude,
            kind: 'relief',
            value: Math.round(value),
            title: 'USGS 3DEP regional elevation',
            note: 'Sample from the archived ~60 m DEM export. Rendered tile detail varies with zoom. Source elevations are displayed radially on a reference sphere; no ellipsoidal-height or flood-depth inference.',
            source: regionalTerrain.manifest,
          };
      }
      if (building)
        return {
          longitude,
          latitude,
          kind: 'building',
          value: building.height,
          title: building.name,
          note:
            building.heightMethod +
            '. Flat roof and local sea-level datum; facade materials are not surveyed.',
          source: `https://www.openstreetmap.org/way/${building.id}`,
        };
      if (hit.object === retrievedCloud && hit.face && lastRetrieved) {
        const positions = retrievedCloud.geometry.getAttribute('position');
        const ids = [hit.face.a, hit.face.b, hit.face.c];
        ids.sort(
          (a, b) =>
            new THREE.Vector3()
              .fromBufferAttribute(positions, a)
              .distanceToSquared(hit.point) -
            new THREE.Vector3()
              .fromBufferAttribute(positions, b)
              .distanceToSquared(hit.point),
        );
        const i = ids[0];
        return {
          longitude: lastRetrieved.navigation[i * 2],
          latitude: lastRetrieved.navigation[i * 2 + 1],
          kind: 'cloud',
          value: lastRetrieved.heights[i],
          title: 'Cloud-top retrieval',
          note: 'Nearest source sample to this triangle. Good quality (DQF = 0). Geopotential height, not cloud thickness; no parallax correction.',
          source: '/data/archive/cloud-height/manifest.json',
          index: lastRetrieved.index,
        };
      }
      if (citySurface.visible && hit.object !== ground)
        return {
          longitude,
          latitude,
          kind: 'local',
          value: 0,
          title: 'Local aerial mosaic',
          note: 'USGS NAIP photograph on a flat sea-level display datum. No street-level terrain or water-depth measurement is available here.',
          source: '/data/archive/earth/manifest.json',
        };
      if (!grid) return;
      return {
        longitude,
        latitude,
        kind: 'relief',
        value: Math.round(elevationAt(grid, longitude, latitude)),
        title: 'ETOPO1 relief sample',
        note: 'Bilinear sample of the archived global overview, about 20 km at the equator. Signed metres relative to sea level; not local terrain accuracy.',
        source: '/data/archive/earth/manifest.json',
      };
    },
    dispose() {
      alive = false;
      terrainTiles?.dispose();
      for (const texture of ownedTextures) texture.dispose();
      (
        satelliteMaterial.uniforms.source.value as THREE.Texture | null
      )?.dispose();
      (cloudMaterial.uniforms.source.value as THREE.Texture | null)?.dispose();
      (
        cloudMaterial.uniforms.previous.value as THREE.Texture | null
      )?.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Sprite) o.material.map?.dispose();
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        if (m.material)
          for (const material of Array.isArray(m.material)
            ? m.material
            : [m.material])
            material.dispose();
      });
      renderer.dispose();
    },
  };
}
