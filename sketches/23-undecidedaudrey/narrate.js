// Narrate: three formulas, each with sliders.
//   1. Z = a R^b: what a radar's "+10 dBZ" means in rain, under different assumptions.
//   2. n = 2 (z_alpha + z_beta)^2 (cv / e)^2: trials needed to tell an effect from chance.
//   3. Seventy-two skies: P0 under every combination of four choices, and whether rain followed the act.
// Data from data/power.json (tools/power.py) and data/skies.json (tools/skies.py).

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

Promise.all([fetch('data/power.json').then(r => r.json()), fetch('data/skies.json').then(r => r.json())])
  .then(([power, skies]) => { drawTrials(power); drawSkies(skies); })
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

// 3. Seventy-two skies: a specification curve. Top: one dot per definition of "rain after the act",
// sorted by P0, filled if that rain followed the 2025 act. Bottom: which choices make each dot.
function drawSkies(data) {
  const canvas = $('skies'), g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { left: 340, right: 30, top: 30 };
  const curveH = 300, rowH = 26, matrixTop = pad.top + curveH + 50;
  const ROWS = [
    ...data.axes.rain.map(v => ({ axis: 'rain', v, label: `a day of ${v} mm or more` })),
    ...data.axes.wait.map(v => ({ axis: 'wait', v, label: `within ${v} days` })),
    { axis: 'compare', v: 'any', label: 'vs any day' },
    { axis: 'compare', v: 'drought', label: 'vs drought days' },
    { axis: 'compare', v: 'like2025', label: 'vs days as dry as 2025' },
    ...data.axes.period.map(v => ({ axis: 'period', v, label: `years ${v.replace('-', '–')}` })),
  ];
  let skies = [], hover = -1;
  const colX = i => pad.left + (i + 0.5) * (W - pad.left - pad.right) / skies.length;
  const py = p => pad.top + (1 - p) * curveH;
  const describe = k => `${k.rain} mm or more within ${k.wait} days, compared with `
    + ({ any: 'any day', drought: 'drought days', like2025: 'days as dry as 2025' })[k.compare]
    + `, ${k.period.replace('-', '–')} (${k.n} days)`;

  function draw() {
    const act = document.querySelector('input[name="sky-act"]:checked').value;
    skies = data.skies.filter(k => k.act === act).sort((a, b) => a.p0 - b.p0);
    g.fillStyle = paper; g.fillRect(0, 0, W, H);
    g.fillStyle = g.strokeStyle = ink;
    g.font = '22px system-ui, sans-serif';

    // Curve axis and the line below which rain would count as unusual.
    g.textAlign = 'right';
    for (const p of [0, 0.5, 1]) {
      g.globalAlpha = 0.3; g.beginPath(); g.moveTo(pad.left, py(p)); g.lineTo(W - pad.right, py(p)); g.stroke(); g.globalAlpha = 1;
      g.fillText(`${Math.round(p * 100)} %`, pad.left - 12, py(p) + 7);
    }
    g.fillText('rain anyway (P₀)', pad.left - 12, py(0.75) + 7);
    g.save(); g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(pad.left, py(0.2)); g.lineTo(W - pad.right, py(0.2)); g.stroke(); g.restore();
    g.fillText('unusual below 20 %', W - pad.right - 8, py(0.2) + 28);
    g.textAlign = 'left';

    skies.forEach((k, i) => {
      const x = colX(i), y = py(k.p0);
      if (i === hover) { g.globalAlpha = 0.15; g.fillRect(x - 7, pad.top, 14, matrixTop + ROWS.length * rowH - pad.top); g.globalAlpha = 1; }
      g.beginPath(); g.arc(x, y, 6, 0, 2 * Math.PI);
      if (k.happened) g.fill(); else { g.lineWidth = 1.5; g.stroke(); }
      ROWS.forEach((r, j) => {
        if (k[r.axis] === r.v) g.fillRect(x - 4, matrixTop + j * rowH + 6, 8, rowH - 12);
      });
    });

    // Matrix row labels and separators between the four choices.
    g.textAlign = 'right';
    ROWS.forEach((r, j) => {
      g.fillText(r.label, pad.left - 12, matrixTop + j * rowH + rowH / 2 + 7);
      if (j > 0 && ROWS[j - 1].axis !== r.axis) {
        g.globalAlpha = 0.3; g.beginPath(); g.moveTo(pad.left, matrixTop + j * rowH); g.lineTo(W - pad.right, matrixTop + j * rowH); g.stroke(); g.globalAlpha = 1;
      }
    });
    g.textAlign = 'left';

    const hap = skies.filter(k => k.happened), rare = hap.filter(k => k.p0 < 0.2);
    const label = act === 'rite' ? 'the rite (23 August)' : 'the first named flight (1 September)';
    $('skies-out').innerHTML = hover >= 0
      ? `<strong>This sky:</strong> ${describe(skies[hover])}. Rain anyway: ${Math.round(skies[hover].p0 * 100)} %. After ${label}: ${skies[hover].happened ? 'it rained' : 'it did not'}.`
      : `After ${label}, rain came in <strong>${hap.length} of ${skies.length}</strong> skies and not in the other ${skies.length - hap.length}. `
        + `It was unusual (below 20 %) in <strong>${rare.length}</strong>` + (rare.length ? `: ${rare.map(describe).join('; ')}.` : '.');
  }

  canvas.addEventListener('mousemove', ev => {
    const r = canvas.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width;
    const i = Math.floor((x - pad.left) / ((W - pad.right - pad.left) / skies.length));
    const next = i >= 0 && i < skies.length ? i : -1;
    if (next !== hover) { hover = next; draw(); }
  });
  canvas.addEventListener('mouseleave', () => { hover = -1; draw(); });
  document.querySelectorAll('input[name="sky-act"]').forEach(r => r.addEventListener('change', draw));
  draw();
}
})();
