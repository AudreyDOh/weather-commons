// The Galton sky. Each drop is a real day (data/galton.json, tools/galton.py). It falls past
// flippers that turn to that day's wind, and lands at the largest daily rain of the next three
// weeks. The pile is the sky when nobody asks. Then the 2025 drops fall, with a faint shadow where
// a drop would land if the ask had added 10 %. Only the shadow is modelled; the paths are drawn.

(() => {
const canvas = document.getElementById('galton');
if (!canvas) return;
const g = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const $ = id => document.getElementById(id);

const EFFECT = 0.10;                 // the shadow: an ask that added 10 %
const MAX_MM = 250;
const AXIS = { left: 60, right: W - 40, y: H - 60 };
const ROWS = [140, 200, 260, 320];   // flipper rows
const DOT = 6;                        // stacked dot width, px
const LAYER = 3;                      // height of each stacked day, px
const RELEASE_EVERY = 3;              // frames between drops (about 20 a second)

const xOf = mm => AXIS.left + Math.min(mm, MAX_MM) / MAX_MM * (AXIS.right - AXIS.left);
const binOf = mm => Math.floor((xOf(mm) - AXIS.left) / DOT);

let data, queue = [], falling = [], landed = [], counts = [], flipAngle = [], flipTarget = [];
let running = false, actDrops = [], frame = 0;

fetch('data/galton.json').then(r => r.json()).then(d => {
  data = d;
  const cols = Math.ceil((AXIS.right - AXIS.left) / DOT) + 1;
  counts = new Array(cols).fill(0);
  ROWS.forEach((_, r) => { flipAngle[r] = []; flipTarget[r] = []; });
  flippers().forEach(f => { flipAngle[f.r][f.i] = 0; flipTarget[f.r][f.i] = 0; });
  queue = shuffled(d.drops);
  describe();
  draw();
  // Start when the board scrolls into view, so it does not run unseen.
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { running = true; loop(); obs.disconnect(); }
  }).observe(canvas);
}).catch(err => { $('galton-out').textContent = 'Could not load the data: ' + err.message; });

function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function flippers() {
  const out = [];
  ROWS.forEach((y, r) => {
    const n = 9, step = (AXIS.right - AXIS.left) / n, off = r % 2 ? step / 2 : step / 4;
    for (let i = 0; i < n; i++) out.push({ r, i, x: AXIS.left + off + i * step, y });
  });
  return out;
}

// Wind blowing *from* wdir pushes *towards* wdir + 180. Screen x is east, screen y is south.
function towards(day) {
  const a = (day.wdir + 180) * Math.PI / 180;
  return { dx: Math.sin(a), dy: -Math.cos(a), angle: Math.atan2(-Math.cos(a), Math.sin(a)) };
}

function launch(day, big = false, shadow = false) {
  const t = towards(day);
  const target = xOf(day.mm);
  const x0 = W / 2 + (Math.random() - 0.5) * 60;
  const kick = t.dx * Math.min(day.wspd || 10, 40) * 3;
  const pts = [[x0, 30]];
  ROWS.forEach((y, k) => {
    const f = (k + 1) / (ROWS.length + 1);
    pts.push([x0 + (target - x0) * f + kick * (1 - f) * (k % 2 ? -0.6 : 1), y]);
  });
  pts.push([target, AXIS.y - 10]);
  // Turn every flipper towards this day's wind.
  ROWS.forEach((_, r) => flipTarget[r] = flipTarget[r].map(() => t.angle));
  const drop = { day, pts, s: 0, big, shadow, speed: big ? 0.0025 : 0.007 };
  falling.push(drop);
  return drop;
}

function position(drop) {
  const seg = drop.pts.length - 1, u = Math.min(drop.s, 1) * seg, i = Math.min(Math.floor(u), seg - 1), f = u - i;
  const [xa, ya] = drop.pts[i], [xb, yb] = drop.pts[i + 1];
  return [xa + (xb - xa) * f, ya + (yb - ya) * f];
}

function loop() {
  if (!running) return;
  if (frame % RELEASE_EVERY === 0 && queue.length) launch(queue.pop());
  step();
  draw();
  if (++frame % 20 === 0) describe();
  if (queue.length || falling.length) requestAnimationFrame(loop);
  else { running = false; finished(); }
}

function step() {
  ROWS.forEach((_, r) => flipAngle[r] = flipAngle[r].map((a, i) => a + (flipTarget[r][i] - a) * 0.04));
  for (const d of falling) d.s += d.speed;
  const done = falling.filter(d => d.s >= 1);
  falling = falling.filter(d => d.s < 1);
  for (const d of done) {
    if (d.big) { actDrops.push(d); describe(); continue; }
    counts[binOf(d.day.mm)]++;
    landed.push(d.day);
  }
}

function draw() {
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = ink;
  g.font = '22px system-ui, sans-serif';

  // Flippers, drawn like the map's wind arrows.
  g.lineWidth = 3;
  for (const f of flippers()) {
    const a = flipAngle[f.r][f.i] || 0, len = 22;
    const x1 = f.x + len * Math.cos(a), y1 = f.y + len * Math.sin(a);
    g.beginPath();
    g.moveTo(f.x - len * Math.cos(a), f.y - len * Math.sin(a)); g.lineTo(x1, y1);
    g.lineTo(x1 - 9 * Math.cos(a - 0.5), y1 - 9 * Math.sin(a - 0.5));
    g.moveTo(x1, y1); g.lineTo(x1 - 9 * Math.cos(a + 0.5), y1 - 9 * Math.sin(a + 0.5));
    g.stroke();
  }
  g.lineWidth = 1;

  // Pile.
  counts.forEach((c, i) => {
    for (let j = 0; j < c; j++) g.fillRect(AXIS.left + i * DOT, AXIS.y - (j + 1) * LAYER, DOT - 1, LAYER - 1);
  });

  // Axis.
  g.beginPath(); g.moveTo(AXIS.left, AXIS.y); g.lineTo(AXIS.right, AXIS.y); g.stroke();
  g.textAlign = 'center';
  for (const mm of [0, 50, 100, 150, 200, 250]) {
    g.beginPath(); g.moveTo(xOf(mm), AXIS.y); g.lineTo(xOf(mm), AXIS.y + 8); g.stroke();
    g.fillText(mm === MAX_MM ? `${mm}+ mm` : `${mm}`, xOf(mm), AXIS.y + 32);
  }
  g.textAlign = 'left';
  g.fillText('largest day of rain in the next three weeks, mm', AXIS.left, AXIS.y + 56 > H ? H - 4 : AXIS.y + 56);

  // Falling drops.
  for (const d of falling) {
    const [x, y] = position(d);
    g.beginPath(); g.arc(x, y, d.big ? 10 : 3, 0, 2 * Math.PI);
    if (d.big) { g.lineWidth = 3; g.fillStyle = paper; g.fill(); g.stroke(); g.fillStyle = ink; g.lineWidth = 1; } else g.fill();
  }

  // The 2025 drops and their shadow. Both 2025 acts landed at the same rain, so each gets its own height.
  actDrops.forEach((d, k) => {
    const x = xOf(d.day.mm), sx = xOf(d.day.mm / (1 + EFFECT));
    const top = AXIS.y - 230 - k * 50;
    g.save();
    g.globalAlpha = 0.45; g.setLineDash([5, 5]);
    g.beginPath(); g.arc(sx, top, 10, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(sx, top + 12); g.lineTo(sx, AXIS.y); g.stroke();
    g.restore();
    g.lineWidth = 3;
    g.beginPath(); g.arc(x, top, 10, 0, 2 * Math.PI); g.stroke();
    g.beginPath(); g.moveTo(x, top + 12); g.lineTo(x, AXIS.y); g.stroke();
    g.lineWidth = 1;
    g.textAlign = 'left';
    g.fillText(d.day.id === 'rite' ? '◇ 2025 rite' : '▲ 2025 flight', x + 16, top + 8);
    g.globalAlpha = 0.6;
    g.textAlign = 'right';
    g.fillText('without a 10 % ask', sx - 16, top - 16);
    g.globalAlpha = 1;
    g.textAlign = 'left';
  });
}

function stats() {
  const mms = landed.map(d => d.mm).sort((a, b) => a - b);
  const q = f => mms.length ? mms[Math.floor(f * (mms.length - 1))] : 0;
  return { n: mms.length, q1: q(0.25), q3: q(0.75), above: mm => mms.filter(v => v >= mm).length };
}

function describe() {
  const s = stats();
  if (!data) return;
  let text = `${s.n.toLocaleString('en-GB')} of ${data.drops.length.toLocaleString('en-GB')} days have fallen.`;
  if (s.n) text += ` Half of them landed between ${Math.round(s.q1)} and ${Math.round(s.q3)} mm: that is how much the sky varies when nobody asks.`;
  const last = actDrops[actDrops.length - 1];
  if (last) {
    const a = last.day, share = a.mm - a.mm / (1 + EFFECT);
    text += ` The ${a.label} (${a.date}) landed at ${Math.round(a.mm)} mm. ${Math.round(100 * s.above(a.mm) / s.n)} % of the days without any ask got as much or more.`
      + ` If the ask added 10 %, its share is the gap to the faint drop: about ${Math.round(share)} mm, against a spread of ${Math.round(s.q3 - s.q1)} mm.`;
  }
  $('galton-out').textContent = text;
}

function finished() {
  describe();
  document.querySelectorAll('[data-act]').forEach(b => { b.disabled = false; });
}

document.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
  const a = data.acts.find(x => x.id === b.dataset.act);
  if (actDrops.some(d => d.day.id === a.id) || falling.some(d => d.big)) return;
  launch(a, true);
  running = true; loop();
}));
$('galton-fill').addEventListener('click', () => {
  const rest = falling.filter(d => !d.big).map(d => d.day).concat(queue);
  queue = [];
  for (const d of rest) { counts[binOf(d.mm)]++; landed.push(d); }
  falling = falling.filter(d => d.big);
  describe(); draw(); finished();
});
$('galton-again').addEventListener('click', () => {
  counts.fill(0); landed = []; falling = []; actDrops = [];
  queue = shuffled(data.drops);
  document.querySelectorAll('[data-act]').forEach(b => { b.disabled = true; });
  describe(); running = true; loop();
});
})();
