// The 2025 case: the list of events, the rain chart and the baseline table.
// Data from data/case-2025.json, made by tools/case_2025.py.

fetch('data/case-2025.json').then(r => r.json()).then(caseData => {
  const ink = getComputedStyle(document.body).color;
  const fmt = d => new Date(d + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  // Events, each with its news source.
  const list = document.getElementById('events');
  for (const e of caseData.events) {
    const li = document.createElement('li');
    const when = e.date_end ? `${fmt(e.date)} to ${fmt(e.date_end)}` : fmt(e.date);
    li.innerHTML = `<strong>${when}.</strong> ${e.text} <span class="muted small">(<a href="${e.url}">${e.source}</a>)</span>`;
    list.append(li);
  }

  // Rain chart: daily bars, the rite as a diamond, the named flight days as triangles.
  const canvas = document.getElementById('rain');
  const g = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = { left: 100, right: 20, top: 44, bottom: 56 };
  const days = caseData.rain;
  const maxMm = 100;
  const bw = (W - pad.left - pad.right) / days.length;
  const bx = i => pad.left + i * bw;
  const by = mm => H - pad.bottom - Math.min(mm, maxMm) / maxMm * (H - pad.top - pad.bottom);
  g.fillStyle = g.strokeStyle = ink;
  g.font = '22px system-ui, sans-serif';

  // Axis and grid
  g.globalAlpha = 0.3;
  for (const mm of [0, 25, 50, 75, 100]) {
    g.beginPath(); g.moveTo(pad.left, by(mm)); g.lineTo(W - pad.right, by(mm)); g.stroke();
  }
  g.globalAlpha = 1;
  g.textAlign = 'right';
  for (const mm of [0, 50, 100]) g.fillText(`${mm} mm`, pad.left - 8, by(mm) + 5);
  g.textAlign = 'left';

  days.forEach((d, i) => {
    if (d.mm > 0) g.fillRect(bx(i) + 1, by(d.mm), bw - 2, by(0) - by(d.mm));
    if (d.date.endsWith('-01') || d.date.endsWith('-15')) g.fillText(fmt(d.date), bx(i), H - pad.bottom + 30);
  });

  const index = date => days.findIndex(d => d.date === date);
  const mark = (date, shape, label) => {
    const i = index(date);
    if (i < 0) return;
    const cx = bx(i) + bw / 2, cy = pad.top - 18;
    g.beginPath();
    if (shape === 'diamond') { g.moveTo(cx, cy - 8); g.lineTo(cx + 8, cy); g.lineTo(cx, cy + 8); g.lineTo(cx - 8, cy); g.closePath(); g.lineWidth = 2; g.stroke(); g.lineWidth = 1; }
    else { g.moveTo(cx, cy - 8); g.lineTo(cx + 7, cy + 6); g.lineTo(cx - 7, cy + 6); g.closePath(); g.fill(); }
    g.save(); g.setLineDash([3, 4]); g.globalAlpha = 0.5;
    g.beginPath(); g.moveTo(cx, cy + 10); g.lineTo(cx, by(0)); g.stroke(); g.restore();
    if (label) g.fillText(label, cx + 12, cy + 5);
  };
  mark(caseData.rite, 'diamond', 'rite');
  caseData.flight_days.forEach((d, k, all) => mark(d, 'triangle', k === all.length - 1 ? 'named flight days' : ''));
  const big = days.filter(d => d.mm >= 30);
  for (const d of big) g.fillText(`${Math.round(d.mm)}`, bx(index(d.date)) - 4, by(d.mm) - 6);

  // Baseline table.
  const b = caseData.baseline;
  const table = document.getElementById('baseline');
  table.innerHTML = '<thead><tr><th>After the day</th><th>Any late-August day, 1940–2024</th>'
    + '<th>Driest 15 % of those days</th><th>After the 2025 rite</th></tr></thead><tbody>'
    + b.outcomes.map(o => `<tr><td>${o.text}</td><td>${o.all} %</td><td>${o.dry} %</td>`
      + `<td>${o.after_rite_2025 ? 'yes' : 'no'}</td></tr>`).join('') + '</tbody>';
  document.getElementById('baseline-note').textContent =
    `In ERA5, the 60 days before the rite had ${b.rite_prior_mm} mm, drier than ${100 - b.rite_prior_rank} % of `
    + `late-August days, but not among the driest 15 % (${b.dry_cut_mm} mm or less). The 25 km cell includes the mountains, `
    + `so it shows the drought less sharply than the city’s own rain gauge would.`;
}).catch(err => { document.getElementById('events').textContent = 'Could not load the data: ' + err.message; });
