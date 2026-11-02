// Operation Popeye, Laos 1966–1972: map, wind-drift simulation, rainfall chart and places.
// Plain JavaScript, no libraries. Data comes from data/ (see tools/ for how it was made).
// To adapt this sketch to another event, start with SETTINGS and PLACES below.

const SETTINGS = {
  area: { west: 100, east: 112, south: 10, north: 21 },   // what the maps show, in degrees
  release: { name: 'Se Kong valley', longitude: 106.9, latitude: 15.4 }, // approximate test area
  dots: 1500,           // how many dots to release
  releaseRadiusKm: 25,  // the circle they start in
  spread: 2000,         // turbulence, as horizontal diffusion in m²/s
  stepSeconds: 300,     // how often a dot moves (five minutes)
  nearKm: 20,           // "passed near a town" means within this distance
  townsToLabel: ['Vientiane', 'Udon Thani', 'Savannakhet', 'Pakxe', 'Saravan', 'Attapu', 'Đồng Hới', 'Hue', 'Da Nang', 'Vinh', 'Kon Tum', 'Stoeng Treng', 'Thakhek'],
};

// Places for part 3, Situate. kind says what sort of evidence places them; source points to the list on the page.
const PLACES = [
  { name: 'Se Kong valley, Laos', longitude: 106.9, latitude: 15.4, kind: 'Documented', source: 1,
    text: 'Where the October 1966 tests took place, "east of the Bolovens Plateau". Placed approximately: the memo gives no coordinates.' },
  { name: 'Supply routes through southern Laos', kind: 'Documented', source: 1,
    text: 'The target: "infiltration routes" carrying trucks south. Not drawn, because we have no sourced map of them.' },
  { name: 'Udon Thani, Thailand', longitude: 102.789, latitude: 17.405, kind: 'Reported', source: 2,
    text: 'The air base the seeding aircraft reportedly flew from. The memo proposed basing two modified C-130s in northeast Thailand.' },
  { name: 'Đồng Hới, North Vietnam', longitude: 106.6, latitude: 17.483, kind: 'Documented', source: 1,
    text: 'Named in the memo as an area "of relatively high population density" inside the proposed target areas.' },
  { name: 'The Mekong', longitude: 105.8, latitude: 15.4, kind: 'Documented', source: 1,
    text: 'The memo feared Popeye could be blamed for "the disastrous Mekong flood of September 1966", and warned of "serious localized flooding" and crop damage.' },
  { name: 'Saravan and Attapu, southern Laos', longitude: 106.43, latitude: 15.72, kind: 'Cartographic', source: 7,
    text: 'Towns near the test area, shown at their present-day positions. No population, damage or exposure is inferred for them.' },
];

const DEG = Math.PI / 180, EARTH = 6371000;
const $ = (id) => document.getElementById(id);
const ink = () => getComputedStyle(document.body).color;
const paper = () => getComputedStyle(document.body).backgroundColor;

// --- Map drawing ------------------------------------------------------------------------
// A simple projection: longitude scaled by the cosine of the middle latitude, so shapes look right.
function projector(canvas) {
  const a = SETTINGS.area, k = Math.cos(((a.north + a.south) / 2) * DEG);
  const w = (a.east - a.west) * k, h = a.north - a.south;
  const scale = Math.min(canvas.width / w, canvas.height / h);
  return {
    xy: (lon, lat) => [(lon - a.west) * k * scale, (a.north - lat) * scale],
    lonlat: (x, y) => [a.west + x / scale / k, a.north - y / scale],
  };
}

function drawBase(ctx, map, p, { labels = true } = {}) {
  const c = ctx.canvas;
  ctx.fillStyle = paper(); ctx.fillRect(0, 0, c.width, c.height);
  const lines = (list, width, dash = []) => {
    ctx.lineWidth = width * 1.6; ctx.setLineDash(dash.map((d) => d * 1.6)); ctx.beginPath();
    for (const line of list) line.forEach(([x, y], i) => { const [px, py] = p.xy(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
    ctx.stroke(); ctx.setLineDash([]);
  };
  ctx.strokeStyle = ink();
  ctx.globalAlpha = 0.35; lines(map.rivers, 1.5);
  ctx.globalAlpha = 0.6; lines(map.borders, 1, [6, 4]);
  ctx.globalAlpha = 1; lines(map.coast, 1.5);
  // Country names, placed by hand at readable spots.
  ctx.fillStyle = ink(); ctx.globalAlpha = 0.45; ctx.font = '600 22px system-ui, sans-serif';
  for (const [name, lon, lat] of [['LAOS', 105.2, 17.9], ['THAILAND', 101.3, 15.2], ['VIETNAM', 108.4, 13.4], ['CAMBODIA', 104.2, 12.7], ['SOUTH CHINA SEA', 109.6, 17.8]]) {
    const [x, y] = p.xy(lon, lat); ctx.fillText(name, x, y);
  }
  ctx.globalAlpha = 1;
  if (!labels) return;
  ctx.font = '24px system-ui, sans-serif';
  for (const t of map.towns.filter((t) => SETTINGS.townsToLabel.includes(t.name))) {
    const [x, y] = p.xy(t.longitude, t.latitude);
    ctx.fillRect(x - 4, y - 4, 8, 8);
    ctx.fillText(t.name, x + 9, y - 8);
  }
}

// --- Wind ---------------------------------------------------------------------------------
// Bilinear interpolation on the grid at one hour; null outside the grid.
function windAt(wind, hour, lon, lat) {
  const g = wind.grid, x = (lon - g.west) / g.dx, y = (lat - g.south) / g.dy;
  if (x < 0 || y < 0 || x > g.width - 1 || y > g.height - 1) return null;
  const i = Math.min(g.width - 2, Math.floor(x)), j = Math.min(g.height - 2, Math.floor(y)), a = x - i, b = y - j;
  const at = (f) => f[j * g.width + i] * (1 - a) * (1 - b) + f[j * g.width + i + 1] * a * (1 - b)
    + f[(j + 1) * g.width + i] * (1 - a) * b + f[(j + 1) * g.width + i + 1] * a * b;
  return [at(wind.u[hour]), at(wind.v[hour])];
}
// Between two archived hours, blend linearly.
function windAtTime(wind, seconds, lon, lat) {
  const h = Math.min(wind.times.length - 1.001, seconds / 3600), h0 = Math.floor(h), f = h - h0;
  const a = windAt(wind, h0, lon, lat), b = windAt(wind, h0 + 1, lon, lat);
  return a && b ? [a[0] * (1 - f) + b[0] * f, a[1] * (1 - f) + b[1] * f] : null;
}

function drawArrows(ctx, wind, hour, p) {
  const g = wind.grid;
  ctx.strokeStyle = ink(); ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
  for (let j = 0; j < g.height; j++) for (let i = 0; i < g.width; i++) {
    const n = j * g.width + i, u = wind.u[hour][n], v = wind.v[hour][n];
    const [x, y] = p.xy(g.west + i * g.dx, g.south + j * g.dy), len = 8 * Math.hypot(u, v);
    const ang = Math.atan2(-v, u), ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey);
    ctx.lineTo(ex - 8 * Math.cos(ang - 0.5), ey - 8 * Math.sin(ang - 0.5));
    ctx.moveTo(ex, ey); ctx.lineTo(ex - 8 * Math.cos(ang + 0.5), ey - 8 * Math.sin(ang + 0.5));
    ctx.stroke();
  }
  // The edge of the wind data.
  const [x0, y0] = p.xy(g.west, g.south + (g.height - 1) * g.dy), [x1, y1] = p.xy(g.west + (g.width - 1) * g.dx, g.south);
  ctx.setLineDash([2, 4]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

// --- Simulation ---------------------------------------------------------------------------
// A seeded random number generator, so every run with the same release gives the same paths.
function random(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6d2b79f5; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Run the whole week once and keep every dot's position at every hour, so the slider can jump anywhere.
function simulate(wind, release) {
  const s = SETTINGS, rng = random(42), n = s.dots, hours = wind.times.length;
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng());
  const lon = new Float64Array(n), lat = new Float64Array(n), alive = new Uint8Array(n).fill(1);
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(rng()) * s.releaseRadiusKm * 1000 / EARTH / DEG, a = rng() * 2 * Math.PI;
    lat[i] = release.latitude + Math.sin(a) * r;
    lon[i] = release.longitude + Math.cos(a) * r / Math.cos(release.latitude * DEG);
  }
  const frames = [], kick = Math.sqrt(2 * s.spread * s.stepSeconds);
  const save = () => frames.push({ lon: Float32Array.from(lon), lat: Float32Array.from(lat), alive: Uint8Array.from(alive) });
  save();
  for (let t = 0; t < (hours - 1) * 3600; t += s.stepSeconds) {
    for (let i = 0; i < n; i++) {
      if (!alive[i]) continue;
      // Midpoint step: look at the wind here, step halfway, use the wind there for the full step.
      const w0 = windAtTime(wind, t, lon[i], lat[i]);
      if (!w0) { alive[i] = 0; continue; }
      const midLat = lat[i] + w0[1] * s.stepSeconds / 2 / EARTH / DEG;
      const midLon = lon[i] + w0[0] * s.stepSeconds / 2 / EARTH / DEG / Math.cos(lat[i] * DEG);
      const w = windAtTime(wind, t + s.stepSeconds / 2, midLon, midLat);
      if (!w) { alive[i] = 0; continue; }
      lon[i] += (w[0] * s.stepSeconds + kick * normal()) / EARTH / DEG / Math.cos(midLat * DEG);
      lat[i] += (w[1] * s.stepSeconds + kick * normal()) / EARTH / DEG;
    }
    if ((t + s.stepSeconds) % 3600 === 0) save();
  }
  return frames;
}

const km = (lon1, lat1, lon2, lat2) => {
  const a = (lat2 - lat1) * DEG, b = (lon2 - lon1) * DEG;
  const h = Math.sin(a / 2) ** 2 + Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(b / 2) ** 2;
  return 2 * EARTH / 1000 * Math.asin(Math.sqrt(Math.min(1, h)));
};

// --- Rainfall chart ------------------------------------------------------------------------
function drawRain(rain, windTimes) {
  const W = 680, H = 170, pad = 24, n = rain.mm.length, max = Math.max(...rain.mm), bw = (W - 2 * pad) / n;
  const first = windTimes[0].slice(0, 10), last = windTimes[windTimes.length - 1].slice(0, 10);
  let bars = '';
  rain.mm.forEach((mm, i) => {
    const h = (mm / max) * (H - 50), d = rain.dates[i], inWeek = d >= first && d <= last;
    bars += `<rect x="${pad + i * bw}" y="${H - 26 - h}" width="${Math.max(1, bw - 1)}" height="${h}" fill="currentColor" opacity="${inWeek ? 1 : 0.45}"><title>${d}: ${mm} mm</title></rect>`;
  });
  const months = [['September', 0], ['October', 30], ['November', 61]].map(([m, i]) => `<text x="${pad + i * bw}" y="${H - 8}" font-size="12" fill="currentColor">${m} 1966</text>`).join('');
  $('rain').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily rainfall, September to November 1966">
    <text x="${pad}" y="14" font-size="12" fill="currentColor">${max.toFixed(0)} mm / day</text>
    <line x1="${pad}" x2="${W - pad}" y1="${H - 26}" y2="${H - 26}" stroke="currentColor" opacity=".4"/>${bars}${months}</svg>
    <figcaption><span class="tag">Reanalysed</span>Daily rainfall in ERA5 at the Se Kong valley. Solid bars: the week the simulation uses. A reanalysis can't show whether seeding added any rain.</figcaption>`;
}

// --- Places (part 3) ----------------------------------------------------------------------
function drawLocator(map, highlight = -1) {
  const c = $('locator'), ctx = c.getContext('2d'), p = projector(c);
  drawBase(ctx, map, p, { labels: false });
  ctx.fillStyle = ink(); ctx.strokeStyle = ink(); ctx.font = '600 24px system-ui, sans-serif';
  PLACES.forEach((pl, i) => {
    if (pl.longitude === undefined) return;
    const [x, y] = p.xy(pl.longitude, pl.latitude), r = i === highlight ? 24 : 18;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = i === highlight ? ink() : paper(); ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = i === highlight ? paper() : ink(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), x, y + 1);
  });
  ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
}

function listPlaces(map) {
  $('places').innerHTML = PLACES.map((pl, i) => `<li><span class="n">${i + 1}</span><button type="button" data-i="${i}">${pl.name}</button>
    <span class="tag${pl.kind === 'Documented' ? '' : ' soft'}" style="margin-left:8px">${pl.kind}</span><sup><a href="#s${pl.source}">${pl.source}</a></sup><br>${pl.text}</li>`).join('');
  $('places').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) drawLocator(map, Number(b.dataset.i)); });
}

// --- Putting it together ----------------------------------------------------------------
async function main() {
  const load = (f) => fetch(f).then((r) => { if (!r.ok) throw Error(`${f}: ${r.status}`); return r.json(); });
  const [wind, rain, map] = await Promise.all([load('data/wind.json'), load('data/rain.json'), load('data/map.json')]);
  const canvas = $('map'), ctx = canvas.getContext('2d'), p = projector(canvas);
  let release = { ...SETTINGS.release }, frames = simulate(wind, release), timer = null;

  function draw() {
    const hour = Number($('hour').value), f = frames[hour];
    drawBase(ctx, map, p);
    if ($('arrows').checked) drawArrows(ctx, wind, hour, p);
    // Dots, with a fading trail over the last six hours.
    for (let back = Math.min(6, hour); back >= 0; back--) {
      const g = frames[hour - back];
      ctx.fillStyle = ink(); ctx.globalAlpha = back ? 0.08 : 0.85;
      for (let i = 0; i < g.lon.length; i++) if (g.alive[i]) { const [x, y] = p.xy(g.lon[i], g.lat[i]); ctx.fillRect(x - 1.5, y - 1.5, 3, 3); }
    }
    ctx.globalAlpha = 1;
    const [rx, ry] = p.xy(release.longitude, release.latitude);
    ctx.strokeStyle = ink(); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx, ry, 14, 0, 2 * Math.PI); ctx.stroke();
    ctx.font = '600 24px system-ui, sans-serif'; ctx.fillStyle = ink(); ctx.fillText(`Release: ${release.name}`, rx + 22, ry + 9);

    // Readouts: distances now, and towns passed so far.
    const d = [];
    for (let i = 0; i < f.lon.length; i++) if (f.alive[i]) d.push(km(release.longitude, release.latitude, f.lon[i], f.lat[i]));
    d.sort((a, b) => a - b);
    $('dist').textContent = `${Math.round(d[Math.floor(d.length / 2)] ?? 0)} km`;
    $('far').textContent = `${Math.round(d[d.length - 1] ?? 0)} km`;
    $('kept').textContent = `${Math.round((d.length / f.lon.length) * 100)}%`;
    const t = new Date(wind.times[hour] + 'Z');
    $('when').textContent = `${t.toUTCString().slice(5, 16)}, ${wind.times[hour].slice(11)} UTC · ${hour} h`;
    const near = new Set();
    for (let h = 0; h <= hour; h += 3) {
      const g = frames[h];
      for (const town of map.towns) {
        if (near.has(town.name)) continue;
        for (let i = 0; i < g.lon.length; i += 5) if (g.alive[i] && km(town.longitude, town.latitude, g.lon[i], g.lat[i]) < SETTINGS.nearKm) { near.add(`${town.name}`); break; }
      }
    }
    $('towns').textContent = `Towns the air passed within ${SETTINGS.nearKm} km of: ${near.size ? [...near].join(', ') : 'none yet'}. Calculated distance only, not exposure.`;
  }

  $('hour').addEventListener('input', draw);
  $('arrows').addEventListener('change', draw);
  $('play').addEventListener('click', () => {
    if (timer) { clearInterval(timer); timer = null; $('play').textContent = 'Play'; return; }
    if (Number($('hour').value) >= wind.times.length - 1) $('hour').value = 0;
    $('play').textContent = 'Pause';
    timer = setInterval(() => {
      const h = Number($('hour').value) + 1;
      if (h >= wind.times.length) { clearInterval(timer); timer = null; $('play').textContent = 'Play'; return; }
      $('hour').value = h; draw();
    }, 80);
  });
  canvas.addEventListener('click', (e) => {
    const r = canvas.getBoundingClientRect();
    const [lon, lat] = p.lonlat((e.clientX - r.left) * canvas.width / r.width, (e.clientY - r.top) * canvas.height / r.height);
    if (!windAt(wind, 0, lon, lat)) { $('towns').textContent = 'There is no wind data there. Click inside the dotted rectangle.'; return; }
    release = { name: `${lat.toFixed(1)}° N, ${lon.toFixed(1)}° E`, longitude: lon, latitude: lat };
    frames = simulate(wind, release); $('hour').value = 0; draw();
  });
  $('reset').addEventListener('click', () => { release = { ...SETTINGS.release }; frames = simulate(wind, release); $('hour').value = 0; draw(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { draw(); drawLocator(map); });

  drawRain(rain, wind.times);
  listPlaces(map);
  drawLocator(map);
  draw();
}

main().catch((e) => { document.querySelector('main').insertAdjacentHTML('afterbegin', `<p class="note">Could not load the data: ${e.message}. Open this page through a web server, not as a file.</p>`); });
