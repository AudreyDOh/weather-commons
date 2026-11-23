// Two speculative skies over Daegwallyeong. Each drop is a real day (data/galton.json). Its three
// weeks of real weather (data/days.json) are rolled again, one day at a time, as if an ask had worked:
//
//   If the rite worked     a dry day turns rainy with chance P, taking the rain of a real rainy day
//                          from the same season; a rainy day gets P more. P is a slider: no one has
//                          measured a rite, so this is interpretive and modelled.
//   If seeding worked      flights on up to six "seedable" days (rain already falling, cloud 60 % or
//                          more) in the two weeks after the day, one or two hours each. Each flight
//                          day gains between 10 % of its rain (KMA) and 1 mm per flight hour (NIMS),
//                          at most 8.5 mm (NIMS, 2020-2024 maximum). Clear days gain nothing. Modelled.
//
// Each board is drawn over the real map (data/terrain.json, data/places.json): rite drops leave from
// the shrine, seeding drops from an approximate flight area over Gangneung and the coast. The
// flippers turn to the falling day's wind. Drops land on a strip at the foot of the map, by rain
// (mm), not by place: speculative in ink, the record behind in blue.
//
// The page first asks how much the viewer believes a rite can bring rain. The answer sets the rite's
// starting power, which graph comes first, and which pile is drawn strongest. It never changes the
// record. The answer stays in this browser only.

(() => {
const canvases = { rite: document.getElementById('spec-rite'), seed: document.getElementById('spec-seed') };
if (!canvases.rite || !canvases.seed) return;
const $ = id => document.getElementById(id);
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
const BLUE = dark ? '57,135,229' : '42,120,214';   // the record

// Board: the map fills the canvas; the pile sits on a strip along its foot.
const W = 1800, H = 1300;
const MAP = { west: 128.55, east: 129.05, south: 37.55, north: 37.835 };   // about 44 km by 32 km
const mx = lon => (lon - MAP.west) / (MAP.east - MAP.west) * W;
const my = lat => (MAP.north - lat) / (MAP.north - MAP.south) * H;
const STRIP = 1000, LEFT = 70, RIGHT = W - 40, AXIS_Y = H - 90;
const ROWS = [740, 820, 900];
const MAX_MM = 250, HEAVY = 50, WAIT = 21, CAMPAIGN = 14, MAX_FLIGHT_DAYS = 6;
const BIN = 12, LAYER = 4;
const RELEASE_EVERY = 3, SPEED = 0.007, BIG_SPEED = 0.0025;
const SEEDABLE_CLOUD = 60, KMA_SHARE = 0.10, NIMS_MM_PER_HOUR = 1, NIMS_MAX = 8.5;
const RITE_DATE = '2025-08-23', FLIGHTS_FROM = '2025-08-26', FLIGHTS_TO = '2025-09-06';
// Approximate flight area: reports say "Gangneung and the east coast"; the paths are not public.
const FLIGHT_AREA = { lon: 128.95, lat: 37.78, rx: 150, ry: 110 };

const BELIEFS = {
  none:   { label: 'not at all', power: 0,  lead: 'seed', strong: 'record' },
  little: { label: 'a little', power: 5,  lead: 'seed', strong: 'record' },
  quite:  { label: 'quite a lot', power: 15, lead: 'rite', strong: 'speculative' },
  fully:  { label: 'completely', power: 40, lead: 'rite', strong: 'speculative' },
};

let galton, years, terrain, places, pool = [], days = [], queue = [], falling = [], landed = [];
let ritePower = 0.10, rollSeed = { rite: 1, seed: 1 }, belief = null;
let dryOnly = false, running = false, frame = 0, flip = 0, flipTarget = 0, started = false, inView = false;
let act = null;
const bases = {};

const xOf = mm => LEFT + Math.min(mm, MAX_MM) / MAX_MM * (RIGHT - LEFT);
const index = date => { const d = new Date(date + 'T00:00:00Z'); return { y: String(d.getUTCFullYear()), i: (d.getUTCMonth() === 7 ? 0 : 31) + d.getUTCDate() - 1 }; };

// A small seeded random generator, so a roll can be replayed when the slider moves.
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h; };

function after(date, n = WAIT) {
  const { y, i } = index(date), r = years[y].rain, c = years[y].cloud;
  return { rain: r.slice(i + 1, i + 1 + n), cloud: c.slice(i + 1, i + 1 + n) };
}

function riteWorld(date) {
  const r = rng(hash(date) ^ rollSeed.rite * 7919), { rain } = after(date);
  return Math.max(...rain.map(mm => {
    const u = r(), v = r();
    if (mm < 1) return u < ritePower ? pool[Math.floor(v * pool.length)] : mm;
    return mm * (1 + ritePower);
  }));
}

function seedWorld(date, start = 1, end = CAMPAIGN) {
  const r = rng(hash(date) ^ rollSeed.seed * 104729), { rain, cloud } = after(date);
  let flights = 0;
  return Math.max(...rain.map((mm, k) => {
    const hours = r() < 0.7 ? 2 : 1, w = r();
    const seedable = k + 1 >= start && k + 1 <= end && mm >= 0.1 && (cloud[k] ?? 0) >= SEEDABLE_CLOUD;
    if (!seedable || flights >= MAX_FLIGHT_DAYS) return mm;
    flights++;
    const a = KMA_SHARE * mm, b = NIMS_MM_PER_HOUR * hours;
    return mm + Math.min(NIMS_MAX, Math.min(a, b) + w * Math.abs(a - b));
  }));
}

const offset = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const real2025 = () => Math.max(...after(RITE_DATE).rain);
const rite2025 = () => riteWorld(RITE_DATE);
const seed2025 = () => seedWorld(RITE_DATE, offset(RITE_DATE, FLIGHTS_FROM), offset(RITE_DATE, FLIGHTS_TO));

const memo = f => { const c = new Map(); const m = date => { if (!c.has(date)) c.set(date, f(date)); return c.get(date); }; m.clear = () => c.clear(); return m; };
const MACHINES = {
  rite: { model: memo(riteWorld), act: rite2025, out: 'spec-rite-out', name: 'if the rite worked', title: 'If the rite worked',
          origin: () => { const s = places.find(p => p.id === 'shrine'); return [mx(s.lon), my(s.lat)]; } },
  seed: { model: memo(date => seedWorld(date)), act: seed2025, out: 'spec-seed-out', name: 'if seeding worked', title: 'If seeding worked',
          origin: () => { const a = Math.random() * 2 * Math.PI, r = Math.sqrt(Math.random());
            return [mx(FLIGHT_AREA.lon) + Math.cos(a) * r * FLIGHT_AREA.rx, my(FLIGHT_AREA.lat) + Math.sin(a) * r * FLIGHT_AREA.ry]; } },
};

Promise.all(['galton', 'days', 'terrain', 'places'].map(n => fetch(`data/${n}.json`).then(r => r.json()))).then(([g, d, t, p]) => {
  galton = g; years = d.years; terrain = t; places = p.places;
  for (const [y, v] of Object.entries(years)) if (y < '2025') v.rain.slice(15, 60).forEach(mm => { if (mm >= 1) pool.push(mm); });
  bases.rite = drawMap('rite'); bases.seed = drawMap('seed');
  restart();
  let saved = null;
  try { saved = localStorage.getItem('23-belief'); } catch (e) { /* storage unavailable: ask every time */ }
  if (saved && BELIEFS[saved]) choose(saved, false);
  new IntersectionObserver(entries => {
    inView = entries.some(e => e.isIntersecting);
    if (inView && belief) go();
  }).observe($('spec-skies'));
}).catch(err => { $('spec-rite-out').textContent = 'Could not load the data: ' + err.message; });

// The map, drawn once per board into an offscreen canvas.
function drawMap(id) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = paper; g.fillRect(0, 0, W, H);   // opaque, so each frame paints over the last
  const { rows, cols, heights } = terrain, f = terrain.frame;
  const px = col => mx(f.west + col * f.step), py = row => my(f.south + row * f.step);
  const h = (r, k) => heights[r * cols + k];
  g.strokeStyle = ink;
  for (const level of [0.5, 200, 400, 600, 800, 1000, 1200]) {
    g.globalAlpha = level < 1 ? 0.55 : level % 400 === 0 ? 0.16 : 0.08;
    g.lineWidth = level < 1 ? 2.5 : 1.2;
    g.beginPath();
    for (let r = 0; r < rows - 1; r++) for (let k = 0; k < cols - 1; k++) {
      const corners = [[r, k], [r, k + 1], [r + 1, k + 1], [r + 1, k]], pts = [];
      for (let q = 0; q < 4; q++) {
        const [r0, k0] = corners[q], [r1, k1] = corners[(q + 1) % 4], a = h(r0, k0), b = h(r1, k1);
        if ((a < level) !== (b < level)) { const s = (level - a) / (b - a); pts.push([px(k0 + (k1 - k0) * s), py(r0 + (r1 - r0) * s)]); }
      }
      for (let q = 0; q + 1 < pts.length; q += 2) { g.moveTo(...pts[q]); g.lineTo(...pts[q + 1]); }
    }
    g.stroke();
  }
  g.globalAlpha = 1; g.lineWidth = 1;
  g.fillStyle = ink; g.font = '26px system-ui, sans-serif';
  g.globalAlpha = 0.6; g.fillText('East Sea', mx(128.99), my(37.64)); g.globalAlpha = 1;

  const halo = (t, x, y) => { g.save(); g.strokeStyle = paper; g.lineWidth = 6; g.lineJoin = 'round'; g.strokeText(t, x, y); g.restore(); g.fillText(t, x, y); };
  for (const p of places.filter(p => ['pass', 'shrine', 'gangneung', 'hoenggye'].includes(p.id))) {
    const x = mx(p.lon), y = my(p.lat);
    g.beginPath();
    if (p.kind === 'ritual') {
      g.moveTo(x, y - 12); g.lineTo(x + 12, y); g.lineTo(x, y + 12); g.lineTo(x - 12, y); g.closePath();
      g.fillStyle = paper; g.fill(); g.lineWidth = id === 'rite' ? 4 : 2; g.stroke(); g.lineWidth = 1; g.fillStyle = ink;
    } else { g.arc(x, y, 6, 0, 2 * Math.PI); g.fill(); }
    g.textAlign = p.id === 'hoenggye' ? 'right' : 'left';
    halo(`${p.name} ${p.ko}`, x + (p.id === 'hoenggye' ? -16 : 18), y + (p.id === 'shrine' ? -12 : p.id === 'pass' ? 30 : 8));
  }
  // The flight area, approximate.
  g.save(); g.setLineDash([10, 8]); g.lineWidth = id === 'seed' ? 3 : 1.5; g.globalAlpha = id === 'seed' ? 1 : 0.4;
  g.beginPath(); g.ellipse(mx(FLIGHT_AREA.lon), my(FLIGHT_AREA.lat), FLIGHT_AREA.rx, FLIGHT_AREA.ry, 0, 0, 2 * Math.PI); g.stroke(); g.restore();
  g.textAlign = 'left';
  g.globalAlpha = id === 'seed' ? 1 : 0.4;
  halo('flight area, approximate', mx(FLIGHT_AREA.lon) - 120, my(FLIGHT_AREA.lat) - FLIGHT_AREA.ry - 14);
  g.globalAlpha = 1;
  // Scale and north.
  const km10 = 10 / (111.32 * Math.cos(37.7 * Math.PI / 180)) / (MAP.east - MAP.west) * W;
  g.fillRect(W - 40 - km10, 150, km10, 4); g.textAlign = 'right'; g.fillText('10 km · N ↑', W - 40, 138);
  // The strip where drops land, over the foot of the map.
  g.globalAlpha = 0.88; g.fillStyle = paper; g.fillRect(0, STRIP, W, H - STRIP); g.globalAlpha = 1;
  g.textAlign = 'left';
  return c;
}

function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function restart() {
  const cut = galton.acts[0].prior;
  days = dryOnly ? galton.drops.filter(d => d.prior <= cut) : galton.drops;
  queue = shuffled(days); falling = []; landed = []; act = null;
  $('spec-act').disabled = true;
  draw(); describe();
}

function go() { if (!running && belief) { running = true; requestAnimationFrame(loop); } }

function towards(day) {
  const a = (day.wdir + 180) * Math.PI / 180;
  return { dx: Math.sin(a), angle: Math.atan2(-Math.cos(a), Math.sin(a)) };
}

// A path from a start point on the map, past the flipper rows, to where the rain puts it on the strip.
function path(day, mm, [x0, y0]) {
  const t = towards(day), kick = t.dx * Math.min(day.wspd || 10, 40) * 3;
  const target = xOf(mm), pts = [[x0, y0]];
  ROWS.forEach((y, k) => { if (y <= y0) return; const f = (k + 1) / (ROWS.length + 1); pts.push([x0 + (target - x0) * f + kick * (1 - f) * (k % 2 ? -0.6 : 1), y]); });
  pts.push([target, AXIS_Y - 10]);
  return pts;
}

function launch(day, big = false) {
  flipTarget = towards(day).angle;
  const starts = { rite: MACHINES.rite.origin(), seed: MACHINES.seed.origin() };
  falling.push({ day, big, s: 0, speed: big ? BIG_SPEED : SPEED, starts });
}

function along(pts, s) {
  const seg = pts.length - 1, u = Math.min(s, 1) * seg, i = Math.min(Math.floor(u), seg - 1), f = u - i;
  const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
  return [xa + (xb - xa) * f, ya + (yb - ya) * f];
}

function loop() {
  if (frame % RELEASE_EVERY === 0 && queue.length) launch(queue.pop());
  flip += (flipTarget - flip) * 0.04;
  for (const d of falling) d.s += d.speed;
  for (const d of falling.filter(d => d.s >= 1)) { if (d.big) act.done = true; else landed.push(d.day); }
  falling = falling.filter(d => d.s < 1);
  draw();
  if (++frame % 20 === 0) describe();
  if (queue.length || falling.length) requestAnimationFrame(loop);
  else { running = false; describe(); $('spec-act').disabled = !!act; }
}

function columns(values) {
  const cols = new Array(Math.ceil((RIGHT - LEFT) / BIN) + 1).fill(0);
  for (const mm of values) cols[Math.floor((xOf(mm) - LEFT) / BIN)]++;
  return cols;
}
const chance = v => v.length ? Math.round(100 * v.filter(x => x >= HEAVY).length / v.length) : 0;
function overlap(a, b) {
  if (!a.length) return 100;
  const bin = v => Math.floor(Math.min(v, MAX_MM) / 10), A = {}, B = {};
  a.forEach(v => { A[bin(v)] = (A[bin(v)] || 0) + 1; }); b.forEach(v => { B[bin(v)] = (B[bin(v)] || 0) + 1; });
  let s = 0; for (const k in A) s += Math.min(A[k], B[k] || 0);
  return Math.round(100 * s / a.length);
}

function drawMachine(id) {
  const m = MACHINES[id], g = canvases[id].getContext('2d');
  const strongRecord = !belief || belief.strong === 'record';
  const realFill = `rgba(${BLUE},${strongRecord ? 0.7 : 0.3})`, realLine = `rgba(${BLUE},${strongRecord ? 1 : 0.55})`;
  const specAlpha = strongRecord ? 0.5 : 1;
  const real = landed.map(d => d.mm), spec = landed.map(d => m.model(d.date));
  g.drawImage(bases[id], 0, 0);
  g.fillStyle = g.strokeStyle = ink;

  // Title, legend and live chances, top left over the map.
  const halo = (t, x, y) => { g.save(); g.strokeStyle = paper; g.lineWidth = 6; g.lineJoin = 'round'; g.strokeText(t, x, y); g.restore(); g.fillText(t, x, y); };
  g.textAlign = 'left'; g.font = 'bold 36px system-ui, sans-serif';
  halo(m.title, 40, 56);
  g.font = '26px system-ui, sans-serif';
  g.globalAlpha = specAlpha; halo(`■ speculative ${chance(spec)} %`, 40, 100); g.globalAlpha = 1;
  g.fillStyle = realLine; halo(`■ the record ${chance(real)} %`, 330, 100); g.fillStyle = ink;
  halo(`chance of a day of ${HEAVY} mm or more within three weeks · piles overlap ${overlap(real, spec)} %`, 40, 140);

  // Flippers over the map, all turned to the falling day's wind.
  g.lineWidth = 3;
  ROWS.forEach((y, r) => {
    const n = 13, step = (RIGHT - LEFT) / n, off = r % 2 ? step / 2 : step / 4;
    for (let i = 0; i < n; i++) {
      const x = LEFT + off + i * step, len = 18, c = Math.cos(flip), s = Math.sin(flip), x1 = x + len * c, y1 = y + len * s;
      g.beginPath(); g.moveTo(x - len * c, y - len * s); g.lineTo(x1, y1);
      g.lineTo(x1 - 8 * Math.cos(flip - 0.5), y1 - 8 * Math.sin(flip - 0.5));
      g.moveTo(x1, y1); g.lineTo(x1 - 8 * Math.cos(flip + 0.5), y1 - 8 * Math.sin(flip + 0.5));
      g.stroke();
    }
  });
  g.lineWidth = 1;

  // The record behind, in blue; the speculative pile in front, as narrower stacked days.
  g.fillStyle = realFill;
  columns(real).forEach((c, i) => { if (c) g.fillRect(LEFT + i * BIN, AXIS_Y - c * LAYER, BIN - 1, c * LAYER); });
  g.fillStyle = ink; g.globalAlpha = specAlpha;
  columns(spec).forEach((c, i) => { for (let j = 0; j < c; j++) g.fillRect(LEFT + i * BIN + 3, AXIS_Y - (j + 1) * LAYER, BIN - 7, LAYER - 1); });
  g.globalAlpha = 1;

  // Axis: rain, not place.
  g.beginPath(); g.moveTo(LEFT, AXIS_Y); g.lineTo(RIGHT, AXIS_Y); g.stroke();
  g.textAlign = 'center';
  for (const mm of [0, 50, 100, 150, 200, 250]) {
    g.beginPath(); g.moveTo(xOf(mm), AXIS_Y); g.lineTo(xOf(mm), AXIS_Y + 8); g.stroke();
    g.fillText(mm === MAX_MM ? '250+' : `${mm}`, xOf(mm), AXIS_Y + 34);
  }
  g.fillText('largest day of rain in the three weeks after each day, mm (the strip measures rain, not place)', W / 2, AXIS_Y + 70);
  g.save(); g.setLineDash([3, 6]); g.globalAlpha = 0.5;
  g.beginPath(); g.moveTo(xOf(HEAVY), STRIP + 10); g.lineTo(xOf(HEAVY), AXIS_Y); g.stroke(); g.restore();

  // 2025: the record in blue, this roll in ink.
  if (act && act.done) {
    const r = real2025(), s = m.act(), top = STRIP + 30;
    g.lineWidth = 3;
    g.strokeStyle = realLine; g.beginPath(); g.arc(xOf(r), top + 50, 12, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(xOf(r), top + 64); g.lineTo(xOf(r), AXIS_Y); g.stroke();
    g.strokeStyle = ink; g.beginPath(); g.arc(xOf(s), top, 12, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(xOf(s), top + 14); g.lineTo(xOf(s), AXIS_Y); g.stroke();
    g.lineWidth = 1; g.textAlign = 'left';
    g.fillStyle = realLine; g.fillText(`2025 as it fell, ${r.toFixed(1)} mm`, xOf(Math.max(r, s)) + 22, top + 58);
    g.fillStyle = ink; g.fillText(`2025 ${m.name}, ${s.toFixed(1)} mm`, xOf(Math.max(r, s)) + 22, top + 8);
  }

  // Falling drops: the record's in blue, the speculative one in ink, on one path until the strip.
  for (const d of falling) {
    const start = d.starts[id], rm = d.big ? real2025() : d.day.mm, sm = d.big ? m.act() : m.model(d.day.date);
    if (!d.paths) d.paths = {};
    if (!d.paths[id]) d.paths[id] = path(d.day, rm, start);
    const pr = d.paths[id], ps = pr.map((p, k) => k === pr.length - 1 ? [xOf(sm), p[1]] : p);
    const [rx, ry] = along(pr, d.s), [sx, sy] = along(ps, d.s), rad = d.big ? 12 : 4;
    g.fillStyle = realLine; g.beginPath(); g.arc(rx, ry, rad, 0, 2 * Math.PI); g.fill();
    g.fillStyle = ink; g.globalAlpha = specAlpha; g.beginPath(); g.arc(sx, sy, rad * 0.8, 0, 2 * Math.PI); g.fill(); g.globalAlpha = 1;
  }
  return { real, spec };
}

function draw() { if (galton) { MACHINES.rite.last = drawMachine('rite'); MACHINES.seed.last = drawMachine('seed'); } }

function describe() {
  if (!galton) return;
  if (!belief) { for (const m of Object.values(MACHINES)) $(m.out).textContent = 'Answer the question above to start.'; return; }
  const n = landed.length, base = `${n.toLocaleString('en-GB')} of ${days.length.toLocaleString('en-GB')} real days${dryOnly ? ' as dry as 2025' : ''} have fallen.`;
  for (const [id, m] of Object.entries(MACHINES)) {
    const { real, spec } = m.last || { real: [], spec: [] };
    let t = base;
    if (n) t += ` In the record, a day of ${HEAVY} mm or more came within three weeks after ${chance(real)} % of them; ${m.name}, ${chance(spec)} % in this roll. The two piles overlap by ${overlap(real, spec)} %.`;
    if (act && act.done) {
      const s = m.act();
      t += ` 2025: ${real2025().toFixed(1)} mm fell on 13 September; ${m.name}, this roll gives ${s.toFixed(1)} mm.`;
      if (id === 'seed') t += ' The last flight was on 6 September, a week before that rain, so seeding could not touch it.';
      if (id === 'rite') t += ' Whatever you believe, the blue drop stays where it fell.';
    }
    $(m.out).textContent = t;
  }
}

// The belief question.
function choose(key, remember = true) {
  belief = BELIEFS[key];
  if (remember) { try { localStorage.setItem('23-belief', key); } catch (e) { /* not remembered */ } }
  ritePower = belief.power / 100;
  $('spec-power').value = belief.power; $('spec-power-out').textContent = `${belief.power} %`;
  MACHINES.rite.model.clear();
  document.querySelectorAll('[data-belief]').forEach(b => b.setAttribute('aria-pressed', b.dataset.belief === key));
  $('belief-ask').hidden = true; $('belief-said').hidden = false;
  $('belief-answer').textContent = belief.label;
  $('spec-rite-lead').textContent = belief.power
    ? `You said you believe in the rite ${belief.label}. In your sky, it gives each dry day a ${belief.power} % chance of rain, and adds ${belief.power} % to each rainy one. Move the slider to change your mind.`
    : 'You said you do not believe a rite can bring rain. In your sky it does nothing, so the black pile is the record rolled again. Move the slider to see what belief would add.';
  $('spec-seed-lead').textContent = belief.lead === 'seed'
    ? 'You doubted the rite. Here is the aircraft, with the agencies’ own numbers.'
    : 'Here is the aircraft, with the agencies’ own numbers. Compare it with your rite.';
  const wrap = $('spec-skies'), first = $(belief.lead === 'rite' ? 'sky-rite' : 'sky-seed'), second = $(belief.lead === 'rite' ? 'sky-seed' : 'sky-rite');
  wrap.append(first, second);
  wrap.hidden = false;
  draw(); describe();
  if (inView) go();
}

document.querySelectorAll('[data-belief]').forEach(b => b.addEventListener('click', () => choose(b.dataset.belief)));
$('belief-again').addEventListener('click', () => { $('belief-ask').hidden = false; $('belief-said').hidden = true; });

$('spec-power').addEventListener('input', e => {
  ritePower = +e.target.value / 100;
  $('spec-power-out').textContent = `${e.target.value} %`;
  MACHINES.rite.model.clear(); draw(); describe();
});
$('spec-roll-rite').addEventListener('click', () => { rollSeed.rite++; MACHINES.rite.model.clear(); draw(); describe(); });
$('spec-roll-seed').addEventListener('click', () => { rollSeed.seed++; MACHINES.seed.model.clear(); draw(); describe(); });
$('spec-act').addEventListener('click', () => {
  if (act) return;
  act = { done: false }; $('spec-act').disabled = true;
  const a = galton.acts[0];
  launch({ date: RITE_DATE, mm: real2025(), wdir: a.wdir, wspd: a.wspd }, true);
  go();
});
$('spec-dry').addEventListener('click', e => {
  dryOnly = !dryOnly;
  e.target.setAttribute('aria-pressed', dryOnly);
  e.target.textContent = dryOnly ? 'All days' : 'Only days as dry as 2025';
  restart(); go();
});
$('spec-fill').addEventListener('click', () => {
  landed.push(...falling.filter(d => !d.big).map(d => d.day), ...queue);
  queue = []; falling = falling.filter(d => d.big);
  if (!falling.length) $('spec-act').disabled = !!act;
  draw(); describe();
});
$('spec-again').addEventListener('click', () => { restart(); go(); });
})();
