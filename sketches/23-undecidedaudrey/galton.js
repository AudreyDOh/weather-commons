// Three Galton skies. The same real days (data/galton.json, tools/galton.py) fall through three
// machines at once, past flippers turned to each day's wind, and land at the largest daily rain of
// the next three weeks.
//   If the rite worked   every landing +10 %        (modelled: an assumed effect)
//   The record           every landing as it fell   (reanalysed, ERA5)
//   If seeding worked    every landing +1 mm        (modelled: about one hour of flying, by the
//                                                     National Institute of Meteorological Sciences'
//                                                     figure, as if it fell on the wettest day)
// The weather sets the chance: "Only days as dry as 2025" keeps the days with as little rain in the
// 60 days before as the rite day had. "Overlay" draws the three piles on one board.
// "Hide the names" shuffles the machines; the viewer guesses which one is the record.
// The 2025 drop is the rain of 13 September 2025, 90.9 mm, the same in every machine.

(() => {
const canvas = document.getElementById('galton');
if (!canvas) return;
const g = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const $ = id => document.getElementById(id);

const WORLDS = [
  { id: 'rite', name: 'If the rite worked', sub: 'every day +10 %, modelled', land: mm => mm * 1.1 },
  { id: 'real', name: 'The record', sub: 'ERA5, as it fell', land: mm => mm },
  { id: 'seed', name: 'If seeding worked', sub: 'every day +1 mm, modelled', land: mm => mm + 1 },
];
const REAL = 1;
const PANEL = 550, GAP = 45, LEFT0 = 30;
const MAX_MM = 250, HEAVY = 50;       // HEAVY: the chance shown is of a day this wet or wetter
const ROWS = [170, 230, 290];         // flipper rows
const TOP = 130;                      // where drops enter
const AXIS_Y = H - 100;
const DOT = 5, WIDE_DOT = 12, LAYER = 3;   // column width side by side, and on the overlay
const RELEASE_EVERY = 3;              // frames between days (about 20 a second)
const SPEED = 0.007, BIG_SPEED = 0.0025;
const ACT = { date: '2025-09-13', mm: 90.9 };   // the rain both 2025 asks landed on

let data, days = [], queue = [], falling = [], landed, flipAngle = 0, flipTarget = 0;
let order = [0, 1, 2], hidden = false, overlay = false, dryOnly = false;
let guesses = { right: 0, all: 0 }, verdict = '';
let running = false, frame = 0, actDropped = false, actFalling = false;

// Panel geometry: three side by side, or one wide board for the overlay.
function panel(slot) {
  if (overlay) return { px: LEFT0, pw: W - 2 * LEFT0, left: LEFT0 + 40, right: W - LEFT0 - 20 };
  const px = LEFT0 + slot * (PANEL + GAP);
  return { px, pw: PANEL, left: px + 20, right: px + PANEL - 10 };
}
const xOf = (p, mm) => p.left + Math.min(mm, MAX_MM) / MAX_MM * (p.right - p.left);

fetch('data/galton.json').then(r => r.json()).then(d => {
  data = d;
  restart();
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { go(); obs.disconnect(); }
  }).observe(canvas);
}).catch(err => { $('galton-out').textContent = 'Could not load the data: ' + err.message; });

function shuffled(list) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

const dryCut = () => data.acts[0].prior;   // rain in the 60 days before the 2025 rite

function restart() {
  days = dryOnly ? data.drops.filter(d => d.prior <= dryCut()) : data.drops;
  landed = WORLDS.map(() => []);
  falling = []; actDropped = false; actFalling = false;
  queue = shuffled(days);
  $('galton-act').disabled = true;
  describe(); draw();
}

function go() { if (!running) { running = true; requestAnimationFrame(loop); } }

// Wind blowing from wdir pushes towards wdir + 180. Screen x is east, screen y is south.
function towards(day) {
  const a = (day.wdir + 180) * Math.PI / 180;
  return { dx: Math.sin(a), angle: Math.atan2(-Math.cos(a), Math.sin(a)) };
}

// One day falls through all three machines at once, on the same path until it lands.
function launch(day, big = false) {
  const t = towards(day);
  const start = (Math.random() - 0.5) * 60;
  const kick = t.dx * Math.min(day.wspd || 10, 40) * 2;
  flipTarget = t.angle;
  WORLDS.forEach((w, wi) => {
    const p = panel(order.indexOf(wi));
    const x0 = p.px + p.pw / 2 + start;
    const mm = big ? day.mm : w.land(day.mm);
    const target = xOf(p, mm);
    const pts = [[x0, TOP]];
    ROWS.forEach((y, k) => {
      const f = (k + 1) / (ROWS.length + 1);
      pts.push([x0 + (target - x0) * f + kick * (1 - f) * (k % 2 ? -0.6 : 1), y]);
    });
    pts.push([target, AXIS_Y - 10]);
    falling.push({ day, wi, mm, pts, s: 0, big, speed: big ? BIG_SPEED : SPEED });
  });
}

function position(d) {
  const seg = d.pts.length - 1, u = Math.min(d.s, 1) * seg, i = Math.min(Math.floor(u), seg - 1), f = u - i;
  const [xa, ya] = d.pts[i], [xb, yb] = d.pts[i + 1];
  return [xa + (xb - xa) * f, ya + (yb - ya) * f];
}

function loop() {
  if (frame % RELEASE_EVERY === 0 && queue.length) launch(queue.pop());
  flipAngle += (flipTarget - flipAngle) * 0.04;
  for (const d of falling) d.s += d.speed;
  for (const d of falling.filter(d => d.s >= 1)) {
    if (d.big) { actDropped = true; actFalling = false; continue; }
    landed[d.wi].push(d.mm);
  }
  falling = falling.filter(d => d.s < 1);
  draw();
  if (++frame % 20 === 0) describe();
  if (queue.length || falling.length) requestAnimationFrame(loop);
  else { running = false; describe(); $('galton-act').disabled = actDropped; }
}

const chance = v => v.length ? Math.round(100 * v.filter(x => x >= HEAVY).length / v.length) : 0;
const share = (v, mm) => v.length ? Math.round(100 * v.filter(x => x >= mm).length / v.length) : 0;
function heights(p, v) {
  const dot = overlay ? WIDE_DOT : DOT;
  const cols = new Array(Math.ceil((p.right - p.left) / dot) + 1).fill(0);
  for (const mm of v) cols[Math.floor((xOf(p, mm) - p.left) / dot)]++;
  return cols;
}

function flippers(p) {
  g.lineWidth = 3;
  ROWS.forEach((y, r) => {
    const n = overlay ? 13 : 5, step = (p.right - p.left) / n, off = r % 2 ? step / 2 : step / 4;
    for (let i = 0; i < n; i++) {
      const x = p.left + off + i * step, len = 18, c = Math.cos(flipAngle), s = Math.sin(flipAngle);
      const x1 = x + len * c, y1 = y + len * s;
      g.beginPath(); g.moveTo(x - len * c, y - len * s); g.lineTo(x1, y1);
      g.lineTo(x1 - 8 * Math.cos(flipAngle - 0.5), y1 - 8 * Math.sin(flipAngle - 0.5));
      g.moveTo(x1, y1); g.lineTo(x1 - 8 * Math.cos(flipAngle + 0.5), y1 - 8 * Math.sin(flipAngle + 0.5));
      g.stroke();
    }
  });
  g.lineWidth = 1;
}

function axisAt(p) {
  g.beginPath(); g.moveTo(p.left, AXIS_Y); g.lineTo(p.right, AXIS_Y); g.stroke();
  g.font = '24px system-ui, sans-serif'; g.textAlign = 'center';
  for (const mm of overlay ? [0, 50, 100, 150, 200, 250] : [0, 100, 200]) {
    const x = xOf(p, mm);
    g.beginPath(); g.moveTo(x, AXIS_Y); g.lineTo(x, AXIS_Y + 8); g.stroke();
    g.fillText(mm === 250 ? '250+ mm' : `${mm}`, x, AXIS_Y + 34);
  }
  if (!overlay) g.fillText('mm', p.right - 10, AXIS_Y + 34);
  // The heavy-rain line the chances refer to.
  g.save(); g.setLineDash([3, 6]); g.globalAlpha = 0.5;
  g.beginPath(); g.moveTo(xOf(p, HEAVY), TOP + 200); g.lineTo(xOf(p, HEAVY), AXIS_Y); g.stroke();
  g.restore();
}

function act2025(p) {
  if (!actDropped) return;
  const x = xOf(p, ACT.mm), top = AXIS_Y - 300;
  g.lineWidth = 3;
  g.beginPath(); g.arc(x, top, 12, 0, 2 * Math.PI); g.stroke();
  g.beginPath(); g.moveTo(x, top + 14); g.lineTo(x, AXIS_Y); g.stroke();
  g.lineWidth = 1;
  g.textAlign = 'left'; g.font = '24px system-ui, sans-serif';
  g.fillText('2025', x + 20, top + 8);
}

function draw() {
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = ink;

  if (overlay) {
    const p = panel(0);
    g.textAlign = 'left'; g.font = 'bold 30px system-ui, sans-serif';
    g.fillText('All three on one board', p.left, 44);
    g.font = '24px system-ui, sans-serif';
    g.fillText(`■ the record ${chance(landed[REAL])} %    ─ if the rite worked ${chance(landed[0])} %    ┄ if seeding worked ${chance(landed[2])} %`, p.left, 80);
    g.fillText(`chance of a day of ${HEAVY} mm or more within three weeks`, p.left, 110);
    flippers(p);
    // The record as stacked days; the two other worlds as outlines of their piles.
    heights(p, landed[REAL]).forEach((c, i) => {
      for (let j = 0; j < c; j++) g.fillRect(p.left + i * WIDE_DOT, AXIS_Y - (j + 1) * LAYER, WIDE_DOT - 2, LAYER - 1);
    });
    [[0, []], [2, [8, 6]]].forEach(([wi, dash]) => {
      const cols = heights(p, landed[wi]);
      g.save(); g.lineWidth = 2.5; g.setLineDash(dash);
      g.beginPath(); g.moveTo(p.left, AXIS_Y);
      cols.forEach((c, i) => { g.lineTo(p.left + i * WIDE_DOT, AXIS_Y - c * LAYER); g.lineTo(p.left + (i + 1) * WIDE_DOT, AXIS_Y - c * LAYER); });
      g.stroke(); g.restore();
    });
    axisAt(p); act2025(p);
  } else {
    for (let slot = 0; slot < 3; slot++) {
      const wi = order[slot], w = WORLDS[wi], p = panel(slot);
      g.textAlign = 'center';
      g.font = 'bold 32px system-ui, sans-serif';
      g.fillText(hidden ? 'ABC'[slot] : w.name, p.px + p.pw / 2, 44);
      g.font = '24px system-ui, sans-serif';
      if (!hidden) g.fillText(w.sub, p.px + p.pw / 2, 78);
      g.fillText(`${HEAVY} mm+ in three weeks: ${chance(landed[wi])} %`, p.px + p.pw / 2, 110);
      flippers(p);
      heights(p, landed[wi]).forEach((c, i) => {
        for (let j = 0; j < c; j++) g.fillRect(p.left + i * DOT, AXIS_Y - (j + 1) * LAYER, DOT - 1, LAYER - 1);
      });
      axisAt(p); act2025(p);
    }
  }

  // Falling drops. On the overlay only the record's drop is drawn solid.
  for (const d of falling) {
    const [x, y] = position(d);
    const solid = !d.big && (!overlay || d.wi === REAL);
    g.beginPath(); g.arc(x, y, d.big ? 12 : 3.5, 0, 2 * Math.PI);
    if (solid) g.fill();
    else { g.lineWidth = d.big ? 3 : 1.5; g.fillStyle = paper; g.fill(); g.stroke(); g.fillStyle = ink; g.lineWidth = 1; }
  }

  g.textAlign = 'center'; g.font = '24px system-ui, sans-serif';
  g.fillText(`largest day of rain in the three weeks after each day · ${dryOnly ? `only days as dry as 2025 (${dryCut()} mm or less in the 60 days before)` : 'all days, 16 Aug – 8 Sep, 1940–2024'}`, W / 2, H - 20);
  g.textAlign = 'left';
}

function describe() {
  if (!data) return;
  const n = landed[REAL].length;
  let text = `${n.toLocaleString('en-GB')} of ${days.length.toLocaleString('en-GB')} real days have fallen`
    + (dryOnly ? ', only days as dry as 2025.' : '.');
  if (hidden) {
    text += ' The names are hidden. Which machine is the record? Click it.';
  } else if (n) {
    text += ` The weather alone gave a day of ${HEAVY} mm or more within three weeks ${chance(landed[REAL])} % of the time.`
      + ` If the rite had added 10 % to every day, ${chance(landed[0])} %. If seeding had added 1 mm, ${chance(landed[2])} %.`;
  }
  if (actDropped && !hidden) {
    text += ` The 2025 drop is the rain of 13 September, ${ACT.mm} mm: as much or more followed ${share(landed[REAL], ACT.mm)} % of these days in the record,`
      + ` ${share(landed[0], ACT.mm)} % if the rite worked and ${share(landed[2], ACT.mm)} % if seeding worked. The one drop sits as easily in any of the three.`;
  }
  if (verdict) text += ' ' + verdict;
  if (guesses.all) text += ` Guesses so far: ${guesses.right} right of ${guesses.all}. By luck alone, one in three.`;
  $('galton-out').textContent = text;
}

canvas.addEventListener('click', e => {
  if (!hidden) return;
  const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width;
  const slot = [0, 1, 2].find(s => { const p = panel(s); return x >= p.px && x <= p.px + p.pw; });
  if (slot === undefined) return;
  const right = order[slot] === REAL;
  guesses.all++; if (right) guesses.right++;
  verdict = right
    ? `Right: ${'ABC'[slot]} is the record, after ${landed[REAL].length.toLocaleString('en-GB')} days.`
    : `Not this time: ${'ABC'[slot]} is “${WORLDS[order[slot]].name.toLowerCase()}”. The record is ${'ABC'[order.indexOf(REAL)]}.`;
  hidden = false; canvas.style.cursor = ''; $('galton-overlay').disabled = false;
  describe(); draw();
});

$('galton-hide').addEventListener('click', () => {
  order = shuffled([0, 1, 2]); hidden = true; overlay = false; verdict = '';
  canvas.style.cursor = 'pointer';
  $('galton-overlay').disabled = true; $('galton-overlay').setAttribute('aria-pressed', 'false');
  restart(); go();
});
$('galton-overlay').addEventListener('click', e => {
  if (hidden) return;
  overlay = !overlay;
  e.target.setAttribute('aria-pressed', overlay);
  e.target.textContent = overlay ? 'Side by side' : 'Overlay';
  for (const d of falling) d.s = 1;   // drops in flight land at once; their paths were for the old layout
  go(); draw(); describe();
});
$('galton-dry').addEventListener('click', e => {
  dryOnly = !dryOnly;
  e.target.setAttribute('aria-pressed', dryOnly);
  e.target.textContent = dryOnly ? 'All days' : 'Only days as dry as 2025';
  restart(); go();
});
$('galton-act').addEventListener('click', () => {
  if (actDropped || actFalling) return;
  actFalling = true; $('galton-act').disabled = true;
  launch({ ...ACT, wdir: data.acts[0].wdir, wspd: data.acts[0].wspd }, true);
  go();
});
$('galton-fill').addEventListener('click', () => {
  const rest = [...new Set(falling.filter(d => !d.big).map(d => d.day))].concat(queue);
  queue = [];
  falling = falling.filter(d => d.big);
  for (const day of rest) WORLDS.forEach((w, wi) => landed[wi].push(w.land(day.mm)));
  if (!falling.length) $('galton-act').disabled = actDropped;
  describe(); draw();
});
$('galton-again').addEventListener('click', () => {
  order = [0, 1, 2]; hidden = false; verdict = ''; canvas.style.cursor = '';
  $('galton-overlay').disabled = false;
  restart(); go();
});
})();
