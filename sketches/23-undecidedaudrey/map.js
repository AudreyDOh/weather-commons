// Daegwallyeong map and plume.
// Layers, bottom to top: terrain contours (cartographic), the ERA5 grid (reanalysed),
// the approximate experiment area, places (cartographic) and the shrine (interpretive),
// wind arrows (reanalysed), and particles carried by that wind (modelled).

const FRAME = { south: 37.5, north: 37.9, west: 128.45, east: 129.05 };
const KM_PER_DEG_LAT = 111.32;
const KM_PER_DEG_LON = KM_PER_DEG_LAT * Math.cos(37.7 * Math.PI / 180);
const AREA_KM = 3;            // radius of the approximate experiment area
const SIM_SECONDS_PER_FRAME = 40;  // so one hour of weather plays in about 1.5 s
const LIFE_HOURS = 3;         // how long a particle is followed
const SPREAD_M = 60;          // random spread per frame, metres (an assumption)
const RELEASE_PER_FRAME = 3;

const canvas = document.getElementById('view');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const base = document.createElement('canvas');
const trails = document.createElement('canvas');
const marks = document.createElement('canvas');  // places and labels, drawn above the particles
base.width = trails.width = marks.width = W;
base.height = trails.height = marks.height = H;

const style = getComputedStyle(document.body);
const ink = style.color;
const paper = style.backgroundColor;

const x = lon => (lon - FRAME.west) / (FRAME.east - FRAME.west) * W;
const y = lat => (FRAME.north - lat) / (FRAME.north - FRAME.south) * H;

const load = name => fetch(`data/${name}.json`).then(r => r.json());

Promise.all([load('terrain'), load('wind'), load('places')])
  .then(([terrain, wind, places]) => start(terrain, wind, places.places))
  .catch(err => { document.getElementById('clock').textContent = 'Could not load the data: ' + err.message; });

function start(terrain, wind, places) {
  const days = wind.days;
  drawBase(terrain, places);

  // Wind as u (east) and v (north) components, which can be averaged; directions cannot.
  // u[day][hour][row][col]
  const u = days.map(d => d.speed.map((g, t) => g.map((row, r) => row.map((s, c) => -s * Math.sin(d.dir[t][r][c] * Math.PI / 180)))));
  const v = days.map(d => d.speed.map((g, t) => g.map((row, r) => row.map((s, c) => -s * Math.cos(d.dir[t][r][c] * Math.PI / 180)))));

  // Bilinear in space, linear in time, on the 0.25 degree ERA5 grid.
  function windAt(lat, lon, hour) {
    const U = u[dayIndex], V = v[dayIndex], last = U.length - 1;
    const fr = (lat - wind.lats[0]) / 0.25, fc = (lon - wind.lons[0]) / 0.25;
    const r = Math.max(0, Math.min(3, Math.floor(fr))), c = Math.max(0, Math.min(3, Math.floor(fc)));
    const a = fr - r, b = fc - c;
    const t0 = Math.max(0, Math.min(last, Math.floor(hour)));
    const t1 = Math.min(last, t0 + 1), f = hour - Math.floor(hour);
    const at = (g, t) => (g[t][r][c] * (1 - a) * (1 - b) + g[t][r][c + 1] * (1 - a) * b
      + g[t][r + 1][c] * a * (1 - b) + g[t][r + 1][c + 1] * a * b);
    return [at(U, t0) * (1 - f) + at(U, t1) * f, at(V, t0) * (1 - f) + at(V, t1) * f];
  }

  // Where particles start: the pass for the 2006 candidate days, the shrine on the 2025 rite day,
  // nowhere on the 2025 flight days, because the flight paths are not public.
  const origins = { pass: [places.find(p => p.id === 'pass'), AREA_KM], shrine: [places.find(p => p.id === 'shrine'), 0.5] };
  const dayButtons = document.getElementById('days');
  const slider = document.getElementById('hour');
  const playButton = document.getElementById('play');
  const clock = document.getElementById('clock');
  let dayIndex = 0, hour = 0, playing = true, dots = [];

  days.forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = d.label + ' · ' + new Date(d.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    b.setAttribute('aria-pressed', i === 0);
    b.onclick = () => { dayIndex = i; hour = 0; reset(); };
    dayButtons.append(b);
  });
  slider.oninput = () => { hour = +slider.value; dots = []; trails.getContext('2d').clearRect(0, 0, W, H); };
  playButton.onclick = () => { playing = !playing; playButton.textContent = playing ? 'Pause' : 'Play'; };

  function reset() {
    dots = [];
    trails.getContext('2d').clearRect(0, 0, W, H);
    [...dayButtons.children].forEach((b, i) => b.setAttribute('aria-pressed', i === dayIndex));
  }

  function release() {
    const origin = origins[days[dayIndex].release];
    if (!origin) return;
    const [at, radius] = origin;
    for (let i = 0; i < RELEASE_PER_FRAME; i++) {
      const ang = Math.random() * 2 * Math.PI, rad = Math.sqrt(Math.random()) * radius;
      dots.push({ lat: at.lat + rad * Math.sin(ang) / KM_PER_DEG_LAT, lon: at.lon + rad * Math.cos(ang) / KM_PER_DEG_LON, age: 0 });
    }
  }

  const tctx = trails.getContext('2d');
  function step() {
    const t = hour;
    if (playing) {
      release();
      const spread = () => (Math.random() - 0.5) * 2 * SPREAD_M / 1000;
      for (const d of dots) {
        const [ue, vn] = windAt(d.lat, d.lon, t);
        d.lat += (vn * SIM_SECONDS_PER_FRAME / 1000 + spread()) / KM_PER_DEG_LAT;
        d.lon += (ue * SIM_SECONDS_PER_FRAME / 1000 + spread()) / KM_PER_DEG_LON;
        d.age += SIM_SECONDS_PER_FRAME / 3600;
      }
      dots = dots.filter(d => d.age < LIFE_HOURS && d.lat > FRAME.south && d.lat < FRAME.north && d.lon > FRAME.west && d.lon < FRAME.east);
      hour += SIM_SECONDS_PER_FRAME / 3600;
      if (hour >= 24) { hour = 0; reset(); }
      slider.value = Math.floor(hour);
    }

    // Fade old trails a little each frame.
    tctx.globalCompositeOperation = 'destination-out';
    tctx.fillStyle = 'rgba(0,0,0,0.03)';
    tctx.fillRect(0, 0, W, H);
    tctx.globalCompositeOperation = 'source-over';
    tctx.fillStyle = ink;
    for (const d of dots) tctx.fillRect(x(d.lon), y(d.lat), 1.5, 1.5);

    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(base, 0, 0);
    drawArrows(t);
    ctx.drawImage(trails, 0, 0);
    ctx.drawImage(marks, 0, 0);

    const hh = String(Math.floor(hour)).padStart(2, '0'), mm = String(Math.floor(hour % 1 * 60)).padStart(2, '0');
    const day = days[dayIndex];
    clock.textContent = `${day.date}, ${hh}:${mm} Korea time · ` + (day.release ? `${dots.length} particles` : 'wind only: flight paths are not public');
    requestAnimationFrame(step);
  }

  function drawArrows(t) {
    ctx.save();
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    for (let lat = 37.55; lat < FRAME.north; lat += 0.05) {
      for (let lon = 128.5; lon < FRAME.east; lon += 0.05) {
        const [ue, vn] = windAt(lat, lon, t);
        const speed = Math.hypot(ue, vn);
        if (speed < 0.2) continue;
        const len = Math.min(44, 8 + 5 * speed);   // 8 px plus 5 px per m/s
        const ang = Math.atan2(-vn, ue);
        const x0 = x(lon), y0 = y(lat);
        const x1 = x0 + len * Math.cos(ang), y1 = y0 + len * Math.sin(ang);
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.lineTo(x1 - 5 * Math.cos(ang - 0.5), y1 - 5 * Math.sin(ang - 0.5));
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 5 * Math.cos(ang + 0.5), y1 - 5 * Math.sin(ang + 0.5));
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  step();
}

function drawBase(terrain, places) {
  const g = base.getContext('2d');
  const { rows, cols, heights } = terrain;
  const f = terrain.frame;
  const px = c => x(f.west + c * f.step), py = r => y(f.south + r * f.step);
  const h = (r, c) => heights[r * cols + c];

  // Contours by marching squares: every 200 m, and the coast at sea level.
  g.strokeStyle = ink;
  for (const level of [0.5, 200, 400, 600, 800, 1000, 1200, 1400]) {
    g.globalAlpha = level < 1 ? 0.9 : level % 400 === 0 ? 0.35 : 0.18;
    g.lineWidth = level < 1 ? 1.5 : 1;
    g.beginPath();
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const corners = [[r, c], [r, c + 1], [r + 1, c + 1], [r + 1, c]];
        const pts = [];
        for (let k = 0; k < 4; k++) {
          const [r0, c0] = corners[k], [r1, c1] = corners[(k + 1) % 4];
          const a = h(r0, c0), b = h(r1, c1);
          if ((a < level) !== (b < level)) {
            const s = (level - a) / (b - a);
            pts.push([px(c0 + (c1 - c0) * s), py(r0 + (r1 - r0) * s)]);
          }
        }
        for (let k = 0; k + 1 < pts.length; k += 2) {
          g.moveTo(pts[k][0], pts[k][1]);
          g.lineTo(pts[k + 1][0], pts[k + 1][1]);
        }
      }
    }
    g.stroke();
  }
  g.globalAlpha = 1;

  // ERA5 grid: cell edges halfway between the 0.25 degree centres.
  g.setLineDash([6, 6]);
  g.globalAlpha = 0.5;
  g.beginPath();
  for (const lat of [37.625, 37.875]) { g.moveTo(0, y(lat)); g.lineTo(W, y(lat)); }
  for (const lon of [128.625, 128.875]) { g.moveTo(x(lon), 0); g.lineTo(x(lon), H); }
  g.stroke();
  g.setLineDash([]);
  g.globalAlpha = 1;
  g.font = '15px system-ui, sans-serif';
  g.fillStyle = ink;
  g.fillText('One ERA5 cell, about 25 km across', x(128.632), y(37.868));
  g.fillText('Sea', x(128.98), y(37.86));

  const m = marks.getContext('2d');
  m.font = g.font;
  m.strokeStyle = m.fillStyle = ink;
  // Text with a thin halo in the page colour, so it stays readable over particles.
  const text = (t, tx, ty) => {
    m.save(); m.strokeStyle = paper; m.lineWidth = 4; m.lineJoin = 'round'; m.strokeText(t, tx, ty); m.restore();
    m.fillText(t, tx, ty);
  };
  // Approximate 2006 experiment area around the pass.
  const pass = places.find(p => p.id === 'pass');
  m.setLineDash([3, 4]);
  m.beginPath();
  m.ellipse(x(pass.lon), y(pass.lat), AREA_KM / KM_PER_DEG_LON / (f.step * (cols - 1)) * W,
    AREA_KM / KM_PER_DEG_LAT / (f.step * (rows - 1)) * H, 0, 0, 2 * Math.PI);
  m.stroke();
  m.setLineDash([]);

  // Places. Filled dot: place. Square: instrument. Open diamond: ritual (interpretive layer).
  for (const p of places) {
    const px0 = x(p.lon), py0 = y(p.lat);
    m.beginPath();
    if (p.kind === 'instrument') m.rect(px0 - 4, py0 - 4, 8, 8);
    else if (p.kind === 'ritual') { m.moveTo(px0, py0 - 7); m.lineTo(px0 + 7, py0); m.lineTo(px0, py0 + 7); m.lineTo(px0 - 7, py0); m.closePath(); }
    else m.arc(px0, py0, 4, 0, 2 * Math.PI);
    if (p.kind === 'ritual') { m.fillStyle = paper; m.fill(); m.lineWidth = 2; m.stroke(); m.lineWidth = 1; }
    else { m.fillStyle = ink; m.fill(); }
    m.fillStyle = ink;
    const label = `${p.name} ${p.ko}`;
    const right = p.id === 'pass' || p.id === 'gn_station' || p.id === 'yongpyong';
    m.textAlign = right ? 'left' : 'right';
    text(label, px0 + (right ? 10 : -10), py0 + (p.id === 'shrine' ? -8 : 5));
  }
  m.textAlign = 'left';
  text('2006 experiment area, approximate', x(pass.lon) + 10, y(pass.lat) + 48);

  // Scale bar, 10 km.
  const bar = 10 / KM_PER_DEG_LON / (FRAME.east - FRAME.west) * W;
  m.fillRect(24, H - 30, bar, 3);
  m.fillText('10 km', 24, H - 38);
  m.fillText('N ↑', W - 50, 30);
}
