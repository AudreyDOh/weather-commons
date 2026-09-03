import { TransportSimulation } from './simulation';
import type { Command } from './types';
let simulation: TransportSimulation | undefined,
  running = true,
  speed = 3,
  elapsed = 0,
  previous = performance.now();
function publish(computeMs = 0) {
  if (!simulation) return;
  const positions = simulation.positions.slice(),
    trails = new Float32Array(simulation.history),
    heights = simulation.heights.slice(),
    trailHeights = new Float32Array(simulation.heightHistory);
  self.postMessage(
    {
      positions,
      trails,
      heights,
      trailHeights,
      hours: simulation.seconds / 3600,
      ...simulation.metrics(),
      computeMs,
      finished: simulation.seconds >= 259200,
    },
    {
      transfer: [
        positions.buffer,
        trails.buffer,
        heights.buffer,
        trailHeights.buffer,
      ],
    },
  );
}
self.onmessage = (event: MessageEvent<Command>) => {
  const c = event.data;
  if (c.type === 'init') {
    simulation = new TransportSimulation(c.contribution, c.count);
    elapsed = 0;
    previous = performance.now();
    publish();
  }
  if (c.type === 'running') {
    running = c.value;
    previous = performance.now();
  }
  if (c.type === 'speed') speed = c.value;
  if (c.type === 'seek' && simulation) {
    const start = performance.now();
    simulation = new TransportSimulation(
      simulation.contribution,
      simulation.count,
    );
    for (
      let i = 0;
      i < Math.round(Math.max(0, Math.min(72, c.hours)) * 12);
      i++
    )
      simulation.step();
    elapsed = 0;
    previous = performance.now();
    publish(performance.now() - start);
  }
};
setInterval(() => {
  const now = performance.now(),
    delta = Math.min(0.15, (now - previous) / 1000);
  previous = now;
  if (!simulation || !running || simulation.seconds >= 259200) return;
  elapsed += delta * speed * 3600;
  const start = performance.now();
  let changed = false;
  while (elapsed >= 300 && simulation.seconds < 259200) {
    simulation.step();
    elapsed -= 300;
    changed = true;
  }
  if (changed) publish(performance.now() - start);
}, 50);
