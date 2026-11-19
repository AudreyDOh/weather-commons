// The zoom: the rain of 13 September 2025, the day both 2025 drops landed on, replayed hour by
// hour (data/zoom.json, tools/zoom.py). Each raindrop stands for 0.1 mm. If an ask had added 10 %,
// one drop in eleven would be its share; in the simulation those drops are hollow. "As the world
// sees it" fills them in, because rain on the ground carries no mark of where it came from.
// Hourly amounts are reanalysed. Drop sizes (Marshall–Palmer) and fall speeds (Atlas et al. 1973)
// are modelled; which drops are hollow is random.

(() => {
const canvas = document.getElementById('zoom');
if (!canvas) return;
const g = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const $ = id => document.getElementById(id);

const MM_PER_DROP = 0.1;
const EFFECT = 0.10;
const SHARE = EFFECT / (1 + EFFECT);   // of the rain that fell, the part a 10 % ask would add
const SECONDS_PER_HOUR = 1.2;          // playback: one hour of rain in 1.2 seconds
const GROUND = H - 70;
const SKY = { left: 40, right: 880 };
const GAUGE = { left: 960, right: 1100, top: 120, mm: 100 };

let data, drops = [], hour = 0, released = 0, landedMm = 0, hollowLanded = 0, running = false, worldView = false;
let last = 0;

fetch('data/zoom.json').then(r => r.json()).then(d => {
  data = d;
  reset();
  draw();
  new IntersectionObserver((entries, obs) => {
    if (entries.some(e => e.isIntersecting)) { start(); obs.disconnect(); }
  }).observe(canvas);
}).catch(err => { $('zoom-out').textContent = 'Could not load the data: ' + err.message; });

function reset() {
  drops = []; hour = 0; released = 0; landedMm = 0; hollowLanded = 0;
}

function start() {
  if (running) return;
  running = true; last = performance.now();
  requestAnimationFrame(loop);
}

// Marshall–Palmer: drop diameters follow exp(-lambda D), lambda = 4.1 R^-0.21 per mm, R in mm/h.
function diameter(rate) {
  const lambda = 4.1 * Math.pow(Math.max(rate, 0.1), -0.21);
  return Math.min(6, Math.max(0.5, -Math.log(1 - Math.random()) / lambda));
}
// Atlas et al. 1973: terminal fall speed in m/s for a drop of diameter D mm.
const fallSpeed = D => Math.max(1, 9.65 - 10.3 * Math.exp(-0.6 * D));

function loop(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (hour < 24) {
    const h = Math.floor(hour), rate = data.hourly_mm[h];
    // Release this hour's drops evenly through the hour.
    const due = Math.round(cumulative(hour) / MM_PER_DROP);
    while (released < due) {
      const D = diameter(rate);
      drops.push({ x: SKY.left + Math.random() * (SKY.right - SKY.left), y: -10 - Math.random() * 40,
                   D, v: fallSpeed(D), hollow: Math.random() < SHARE });
      released++;
    }
    hour = Math.min(24, hour + dt / SECONDS_PER_HOUR);
  }
  for (const d of drops) d.y += d.v * 70 * dt;   // screen speed in proportion to fall speed
  const down = drops.filter(d => d.y >= GROUND);
  drops = drops.filter(d => d.y < GROUND);
  for (const d of down) { landedMm += MM_PER_DROP; if (d.hollow) hollowLanded++; }
  draw();
  describe();
  if (hour < 24 || drops.length) requestAnimationFrame(loop);
  else running = false;
}

// Rain (mm) fallen by a fractional hour, interpolating within the hour.
function cumulative(t) {
  const h = Math.floor(t);
  let mm = 0;
  for (let i = 0; i < h && i < 24; i++) mm += data.hourly_mm[i];
  if (h < 24) mm += data.hourly_mm[h] * (t - h);
  return mm;
}

function draw() {
  g.fillStyle = paper; g.fillRect(0, 0, W, H);
  g.strokeStyle = g.fillStyle = ink;
  g.font = '22px system-ui, sans-serif';

  // Raindrops as short streaks: longer for faster, larger drops.
  for (const d of drops) {
    const len = 6 + d.v * 2.2, wid = 1 + d.D * 0.7;
    if (d.hollow && !worldView) {
      g.lineWidth = 1.2;
      g.strokeRect(d.x - wid, d.y - len, wid * 2, len);
    } else {
      g.fillRect(d.x - wid / 2, d.y - len, wid, len);
    }
  }
  g.lineWidth = 1;

  // Ground.
  g.beginPath(); g.moveTo(SKY.left, GROUND); g.lineTo(SKY.right, GROUND); g.stroke();
  g.textAlign = 'left';
  const h = Math.min(23, Math.floor(hour));
  g.fillText(`13 September 2025, ${String(h).padStart(2, '0')}:00 · ${data.hourly_mm[h]} mm this hour`, SKY.left, GROUND + 34);

  // The gauge: a cylinder that fills with the rain so far, like a Joseon rain gauge (측우기).
  const gx = GAUGE.left, gw = GAUGE.right - GAUGE.left, gb = GROUND, gt = GAUGE.top;
  const yOf = mm => gb - Math.min(mm, GAUGE.mm) / GAUGE.mm * (gb - gt);
  g.lineWidth = 2;
  g.strokeRect(gx, gt, gw, gb - gt);
  g.lineWidth = 1;
  g.fillRect(gx, yOf(landedMm), gw, gb - yOf(landedMm));
  if (!worldView && landedMm > 0) {
    // In the simulation, the share is the top eleventh of the water, outlined.
    const shareMm = hollowLanded * MM_PER_DROP;
    g.fillStyle = paper;
    g.fillRect(gx + 3, yOf(landedMm), gw - 6, yOf(landedMm - shareMm) - yOf(landedMm));
    g.fillStyle = ink;
    g.setLineDash([4, 4]);
    g.strokeRect(gx + 3, yOf(landedMm), gw - 6, yOf(landedMm - shareMm) - yOf(landedMm));
    g.setLineDash([]);
  }
  g.textAlign = 'center';
  for (const mm of [0, 50, 100]) g.fillText(`${mm}`, gx - 28, yOf(mm) + 7);
  g.fillText(`${landedMm.toFixed(1)} mm`, gx + gw / 2, gt - 16);
  g.textAlign = 'left';
}

function describe() {
  const total = landedMm, share = hollowLanded * MM_PER_DROP;
  $('zoom-out').textContent = worldView
    ? `${total.toFixed(1)} mm has fallen. Every drop looks the same. Nothing in the gauge says which part, if any, came from the rite or the aircraft.`
    : `${total.toFixed(1)} mm has fallen. In the simulation, ${share.toFixed(1)} mm of it is marked as the share a 10 % ask would add: one drop in eleven, chosen at random. Switch to the world’s view to see what a rain gauge sees.`;
}

$('zoom-view').addEventListener('click', e => {
  worldView = !worldView;
  e.target.textContent = worldView ? 'As the simulation sees it' : 'As the world sees it';
  e.target.setAttribute('aria-pressed', worldView);
  draw(); describe();
});
$('zoom-again').addEventListener('click', () => { reset(); running = false; start(); });
})();
