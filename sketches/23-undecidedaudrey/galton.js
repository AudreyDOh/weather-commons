// Two speculative skies. Each drop is a real day (data/galton.json). Its three weeks of real
// weather (data/days.json) are rolled again, one day at a time, as if an ask had worked:
//
//   If the rite worked     a dry day turns rainy with chance P, taking the rain of a real rainy day
//                          from the same season; a rainy day gets P more. P is a slider: no one has
//                          measured a rite, so this is interpretive and modelled.
//   If seeding worked      flights on up to six "seedable" days (rain already falling, cloud 60 % or
//                          more) in the two weeks after the day, one or two hours each. Each flight
//                          day gains between 10 % of its rain (KMA) and 1 mm per flight hour (NIMS),
//                          at most 8.5 mm (NIMS, 2020-2024 maximum). Clear days gain nothing. Modelled.
//
// The drop lands at the largest day of rain in the three weeks, speculative in ink, with the real
// pile behind it in colour. Every roll is different: the chance is in the model, the weather is real.

(() => {
const canvases = { rite: document.getElementById('spec-rite'), seed: document.getElementById('spec-seed') };
if (!canvases.rite || !canvases.seed) return;
const $ = id => document.getElementById(id);
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
const REAL = dark ? 'rgba(57,135,229,0.55)' : 'rgba(42,120,214,0.45)';   // the record, behind
const REAL_LINE = dark ? '#3987e5' : '#2a78d6';

const W = 1800, H = 640;
const LEFT = 70, RIGHT = W - 40, AXIS_Y = H - 80, TOP = 120;
const ROWS = [170, 230, 290];
const MAX_MM = 250, HEAVY = 50, WAIT = 21, CAMPAIGN = 14, MAX_FLIGHT_DAYS = 6;
const BIN = 12, LAYER = 4;
const RELEASE_EVERY = 3, SPEED = 0.007, BIG_SPEED = 0.0025;
const SEEDABLE_CLOUD = 60, KMA_SHARE = 0.10, NIMS_MM_PER_HOUR = 1, NIMS_MAX = 8.5;
const RITE_DATE = '2025-08-23', FLIGHTS_FROM = '2025-08-26', FLIGHTS_TO = '2025-09-06';

let galton, years, pool = [], days = [], queue = [], falling = [], landed = [];
let ritePower = 0.10, rollSeed = { rite: 1, seed: 1 };
let dryOnly = false, running = false, frame = 0, flip = 0, flipTarget = 0;
let act = null;   // the 2025 day once dropped

const xOf = mm => LEFT + Math.min(mm, MAX_MM) / MAX_MM * (RIGHT - LEFT);
const index = date => { const d = new Date(date + 'T00:00:00Z'); return { y: String(d.getUTCFullYear()), i: (d.getUTCMonth() === 7 ? 0 : 31) + d.getUTCDate() - 1 }; };

// A small seeded random generator, so a roll can be replayed when the slider moves.
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h; };

// The real rain on the days after a date: wait days, starting the next day.
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

// Seeding: flights start the day after the ask (in 2025, three days after the rite: see seed2025).
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

// 2025 as it happened: the rite on 23 August; flights from 26 August to 6 September.
const offset = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
const real2025 = () => Math.max(...after(RITE_DATE).rain);
const rite2025 = () => riteWorld(RITE_DATE);
const seed2025 = () => seedWorld(RITE_DATE, offset(RITE_DATE, FLIGHTS_FROM), offset(RITE_DATE, FLIGHTS_TO));

// Each roll is cached per day; a new roll or a new slider value clears it.
const memo = f => { const c = new Map(); const m = date => { if (!c.has(date)) c.set(date, f(date)); return c.get(date); }; m.clear = () => c.clear(); return m; };
const MACHINES = {
  rite: { model: memo(riteWorld), act: rite2025, out: 'spec-rite-out', name: 'if the rite worked' },
  seed: { model: memo(date => seedWorld(date)), act: seed2025, out: 'spec-seed-out', name: 'if seeding worked' },
};

Promise.all([fetch('data/galton.json').then(r => r.json()), fetch('data/days.json').then(r => r.json())]).then(([g, d]) => {
  galton = g; years = d.years;
  // Rainy days (1 mm or more) of the season, 16 August - 29 September, 1940-2024: what a rite might add.
  for (const [y, v] of Object.entries(years)) if (y < '2025') v.rain.slice(15, 60).forEach(mm => { if (mm >= 1) pool.push(mm); });
  restart();
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { go(); obs.disconnect(); }
  }).observe(canvases.rite);
}).catch(err => { $('spec-rite-out').textContent = 'Could not load the data: ' + err.message; });

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

function go() { if (!running) { running = true; requestAnimationFrame(loop); } }

function towards(day) {
  const a = (day.wdir + 180) * Math.PI / 180;
  return { dx: Math.sin(a), angle: Math.atan2(-Math.cos(a), Math.sin(a)) };
}

function path(day, mm) {
  const t = towards(day), x0 = W / 2 + (Math.random() - 0.5) * 80, kick = t.dx * Math.min(day.wspd || 10, 40) * 3;
  const target = xOf(mm), pts = [[x0, TOP]];
  ROWS.forEach((y, k) => { const f = (k + 1) / (ROWS.length + 1); pts.push([x0 + (target - x0) * f + kick * (1 - f) * (k % 2 ? -0.6 : 1), y]); });
  pts.push([target, AXIS_Y - 10]);
  return pts;
}

function launch(day) {
  flipTarget = towards(day).angle;
  falling.push({ day, s: 0, speed: SPEED, pts: path(day, day.mm) });
}

function position(d, pts) {
  const seg = pts.length - 1, u = Math.min(d.s, 1) * seg, i = Math.min(Math.floor(u), seg - 1), f = u - i;
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
  const real = landed.map(d => d.mm), spec = landed.map(d => m.model(d.date));
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = ink;

  // Legend and live chances.
  g.textAlign = 'left'; g.font = 'bold 32px system-ui, sans-serif';
  g.fillText(id === 'rite' ? 'If the rite worked' : 'If seeding worked', LEFT, 48);
  g.font = '24px system-ui, sans-serif';
  g.fillText(`■ speculative ${chance(spec)} %`, LEFT, 88);
  g.fillStyle = REAL_LINE; g.fillText(`■ the record ${chance(real)} %`, LEFT + 290, 88);
  g.fillStyle = ink; g.fillText(`chance of a day of ${HEAVY} mm or more within three weeks · piles overlap ${overlap(real, spec)} %`, LEFT + 560, 88);

  // Flippers, turned to the falling day's wind.
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

  // The record behind, in colour; the speculative pile in front, as narrower stacked days.
  g.fillStyle = REAL;
  columns(real).forEach((c, i) => { if (c) g.fillRect(LEFT + i * BIN, AXIS_Y - c * LAYER, BIN - 1, c * LAYER); });
  g.fillStyle = ink;
  columns(spec).forEach((c, i) => { for (let j = 0; j < c; j++) g.fillRect(LEFT + i * BIN + 3, AXIS_Y - (j + 1) * LAYER, BIN - 7, LAYER - 1); });

  // Axis and the heavy-rain line.
  g.beginPath(); g.moveTo(LEFT, AXIS_Y); g.lineTo(RIGHT, AXIS_Y); g.stroke();
  g.textAlign = 'center';
  for (const mm of [0, 50, 100, 150, 200, 250]) {
    g.beginPath(); g.moveTo(xOf(mm), AXIS_Y); g.lineTo(xOf(mm), AXIS_Y + 8); g.stroke();
    g.fillText(mm === MAX_MM ? '250+' : `${mm}`, xOf(mm), AXIS_Y + 34);
  }
  g.fillText('largest day of rain in the three weeks after each day, mm', W / 2, AXIS_Y + 66);
  g.save(); g.setLineDash([3, 6]); g.globalAlpha = 0.5;
  g.beginPath(); g.moveTo(xOf(HEAVY), TOP + 200); g.lineTo(xOf(HEAVY), AXIS_Y); g.stroke(); g.restore();

  // 2025: the record in colour, this roll in ink.
  if (act && act.done) {
    const r = real2025(), s = m.act(), top = AXIS_Y - 300;
    g.lineWidth = 3;
    g.strokeStyle = REAL_LINE; g.beginPath(); g.arc(xOf(r), top, 12, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(xOf(r), top + 14); g.lineTo(xOf(r), AXIS_Y); g.stroke();
    g.strokeStyle = ink; g.beginPath(); g.arc(xOf(s), top - 50, 12, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(xOf(s), top - 36); g.lineTo(xOf(s), AXIS_Y); g.stroke();
    g.lineWidth = 1; g.textAlign = 'left';
    g.fillStyle = REAL_LINE; g.fillText(`2025 as it fell, ${r.toFixed(1)} mm`, xOf(r) + 20, top + 8);
    g.fillStyle = ink; g.fillText(`2025 ${m.name}, ${s.toFixed(1)} mm`, xOf(Math.max(r, s)) + 20, top - 42);
  }

  // Falling drops: the record's in colour, the speculative one in ink, on the same path until the end.
  for (const d of falling) {
    const sm = d.big ? m.act() : m.model(d.day.date), rm = d.big ? real2025() : d.day.mm;
    const pr = position(d, d.pts), ps = position(d, d.pts.map((p, k) => k === d.pts.length - 1 ? [xOf(sm), p[1]] : k === d.pts.length - 2 ? [p[0] + (xOf(sm) - xOf(rm)) * 0.5, p[1]] : p));
    const rad = d.big ? 12 : 4;
    g.fillStyle = REAL_LINE; g.beginPath(); g.arc(pr[0], pr[1], rad, 0, 2 * Math.PI); g.fill();
    g.fillStyle = ink; g.beginPath(); g.arc(ps[0], ps[1], rad * 0.8, 0, 2 * Math.PI); g.fill();
  }
  return { real, spec };
}

function draw() { if (galton) { MACHINES.rite.last = drawMachine('rite'); MACHINES.seed.last = drawMachine('seed'); } }

function describe() {
  if (!galton) return;
  const n = landed.length, base = `${n.toLocaleString('en-GB')} of ${days.length.toLocaleString('en-GB')} real days${dryOnly ? ' as dry as 2025' : ''} have fallen.`;
  for (const [id, m] of Object.entries(MACHINES)) {
    const { real, spec } = m.last || { real: [], spec: [] };
    let t = base;
    if (n) t += ` In the record, a day of ${HEAVY} mm or more came within three weeks after ${chance(real)} % of them; ${m.name}, ${chance(spec)} % in this roll. The two piles overlap by ${overlap(real, spec)} %.`;
    if (act && act.done) {
      const s = m.act();
      t += ` 2025: ${real2025().toFixed(1)} mm fell on 13 September; ${m.name}, this roll gives ${s.toFixed(1)} mm.`;
      if (id === 'seed') t += ' The last flight was on 6 September, a week before that rain, so seeding could not touch it.';
    }
    $(m.out).textContent = t;
  }
}

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
  const a = galton.acts[0], day = { date: RITE_DATE, mm: real2025(), wdir: a.wdir, wspd: a.wspd };
  falling.push({ day, big: true, s: 0, speed: BIG_SPEED, pts: path(day, day.mm) });
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
