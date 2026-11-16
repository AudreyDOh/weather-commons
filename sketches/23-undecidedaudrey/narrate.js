// Narrate: three formulas, each with sliders.
//   1. Z = a R^b: what a radar's "+10 dBZ" means in rain, under different assumptions.
//   2. n = 2 (z_alpha + z_beta)^2 (cv / e)^2: trials needed to tell an effect from chance.
//   3. FAR = 1 - P0 / P1: the share of rainy outcomes that the act can claim.
// Data from data/power.json (tools/power.py) and data/case-2025.json (tools/case_2025.py).

(() => {
const ink = getComputedStyle(document.body).color;
const paper = getComputedStyle(document.body).backgroundColor;
const $ = id => document.getElementById(id);
const fmtN = n => n.toLocaleString('en-GB');

function slider(id, onInput) {
  const el = $(id);
  el.addEventListener('input', onInput);
  return el;
}

// 1. Radar reflectivity to rain rate. Z in mm^6 m^-3, dBZ = 10 log10 Z, R in mm/h (snow: water equivalent).
const RELATIONS = [
  { name: 'Marshall–Palmer, rain', a: 200, b: 1.6 },
  { name: 'US NEXRAD default, convective rain', a: 300, b: 1.4 },
  { name: 'Gunn–Marshall, snow', a: 2000, b: 2.0 },
];
function drawZR() {
  const base = +$('zr-base').value, delta = +$('zr-delta').value;
  $('zr-base-out').textContent = `${base} dBZ`;
  $('zr-delta-out').textContent = `+${delta} dBZ`;
  const rate = (dbz, r) => Math.pow(Math.pow(10, dbz / 10) / r.a, 1 / r.b);
  $('zr-table').innerHTML = '<thead><tr><th>Assumed relation</th><th>Before</th><th>After</th><th>Rain multiplied by</th></tr></thead><tbody>'
    + RELATIONS.map(r => {
      const r0 = rate(base, r), r1 = rate(base + delta, r);
      return `<tr><td>${r.name}: Z = ${r.a} R<sup>${r.b}</sup></td><td>${r0.toFixed(2)} mm/h</td><td>${r1.toFixed(2)} mm/h</td><td>× ${(r1 / r0).toFixed(1)}</td></tr>`;
    }).join('') + '</tbody>';
}
slider('zr-base', drawZR);
slider('zr-delta', drawZR);
drawZR();

Promise.all([fetch('data/power.json').then(r => r.json()), fetch('data/case-2025.json').then(r => r.json())])
  .then(([power, caseData]) => { drawTrials(power); drawFar(caseData); })
  .catch(err => { $('trials-out').textContent = 'Could not load the data: ' + err.message; });

// 2. Trials needed against trials run.
function drawTrials(power) {
  const canvas = $('trials'), g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { left: 480, right: 90, top: 20, bottom: 44 };
  const lo = 1, hi = 1e6;
  const lx = v => pad.left + (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) * (W - pad.left - pad.right);
  const zz = (power.z_alpha + power.z_beta) ** 2;

  function draw() {
    const e = +$('trials-effect').value / 100;
    const n = Math.ceil(2 * zz * (power.cv / e) ** 2);
    $('trials-effect-out').textContent = `${Math.round(e * 100)} %`;
    $('trials-out').innerHTML = `n = 2 × (${power.z_alpha} + ${power.z_beta})<sup>2</sup> × (${power.cv} ÷ ${e.toFixed(2)})<sup>2</sup> = <strong>${fmtN(n)}</strong> seeded days and as many unseeded ones.`;

    const rows = [
      { label: `Needed, ${Math.round(e * 100)} % effect`, n, strong: true },
      { label: 'Rainy days in 85 years', n: power.days },
      ...power.trials.map(t => ({ label: t.label, n: t.n })),
    ];
    g.fillStyle = paper; g.fillRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = ink;
    g.font = '24px system-ui, sans-serif';
    const rowH = (H - pad.top - pad.bottom) / rows.length;
    rows.forEach((r, i) => {
      const y = pad.top + i * rowH;
      g.textAlign = 'right';
      g.fillText(r.label, pad.left - 12, y + rowH / 2 + 8);
      g.globalAlpha = r.strong ? 1 : 0.6;
      g.fillRect(pad.left, y + rowH * 0.2, lx(r.n) - pad.left, rowH * 0.6);
      g.globalAlpha = 1;
      g.textAlign = 'left';
      g.fillText(fmtN(r.n), lx(r.n) + 8, y + rowH / 2 + 8);
    });
    g.textAlign = 'center';
    for (const v of [1, 10, 100, 1000, 1e4, 1e5, 1e6]) {
      g.globalAlpha = 0.3; g.beginPath(); g.moveTo(lx(v), pad.top); g.lineTo(lx(v), H - pad.bottom); g.stroke(); g.globalAlpha = 1;
      g.fillText(fmtN(v), lx(v), H - pad.bottom + 30);
    }
  }
  slider('trials-effect', draw);
  $('trials-cv').textContent = `${fmtN(power.days)} days, mean ${power.mean_mm} mm, standard deviation ${power.sd_mm} mm, so cv = ${power.cv}`;
  const mc = power.monte_carlo.map(m => `${Math.round(m.share_detected * 100)} % at ${Math.round(m.effect * 100)} %`).join(', ');
  $('trials-mc').textContent = `Checked by drawing real ERA5 days into seeded and unseeded groups many times: the test found the effect ${mc}. The formula aims for 80 %; with rain this skewed and fewer days, it is a little optimistic.`;
  draw();
}

// 3. Fraction of attributable risk, as a field of 100 days.
function drawFar(caseData) {
  const canvas = $('far'), g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const outcomes = caseData.baseline.outcomes;
  const select = $('far-outcome');
  outcomes.forEach((o, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = `${o.text} (anyway: ${o.all} %)`;
    select.append(opt);
  });
  select.addEventListener('change', draw);
  slider('far-boost', draw);
  document.querySelectorAll('input[name="far-act"]').forEach(r => r.addEventListener('change', draw));

  function draw() {
    const o = outcomes[+select.value];
    const p0 = o.all / 100;
    const boost = +$('far-boost').value / 100;
    const p1 = Math.min(1, p0 + boost);
    const far = p1 > 0 ? 1 - p0 / p1 : 0;
    const act = document.querySelector('input[name="far-act"]:checked').value;
    $('far-boost-out').textContent = `+${Math.round(boost * 100)} points`;
    $('far-out').innerHTML = `P<sub>0</sub> = ${p0.toFixed(2)} (rain anyway), P<sub>1</sub> = ${p1.toFixed(2)} (with the ${act}). `
      + `FAR = 1 − ${p0.toFixed(2)} ÷ ${p1.toFixed(2)} = <strong>${far.toFixed(2)}</strong>. `
      + `Of the days on which it rained after the ${act}, ${Math.round(far * 100)} in 100 can be credited to it, and nobody can say which ones.`;

    g.fillStyle = paper; g.fillRect(0, 0, W, H);
    const cols = 20, rows = 5, size = Math.min((W - 40) / cols, (H - 20) / rows);
    const anyway = Math.round(p0 * 100), extra = Math.round(p1 * 100) - anyway;
    for (let i = 0; i < 100; i++) {
      const x = 20 + (i % cols) * size, y = 10 + Math.floor(i / cols) * size;
      g.strokeStyle = g.fillStyle = ink;
      g.lineWidth = 1.5;
      if (i < anyway) g.fillRect(x + 4, y + 4, size - 8, size - 8);           // rain anyway
      else if (i < anyway + extra) {                                           // rain because of the act
        g.strokeRect(x + 4, y + 4, size - 8, size - 8);
        g.beginPath(); g.moveTo(x + 4, y + size - 4); g.lineTo(x + size - 4, y + 4); g.stroke();
      } else {                                                                 // dry
        g.globalAlpha = 0.35; g.strokeRect(x + 4, y + 4, size - 8, size - 8); g.globalAlpha = 1;
      }
    }
  }
  draw();
}
})();
