'use client';
import { useEffect, useRef } from 'react';
import type { Contribution, Snapshot } from './types';
import { validateContribution } from './contributions';
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type ModelContext = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function useWeatherTools(
  contribution: Contribution,
  snapshot: Snapshot,
  running: boolean,
  start: (c: Contribution) => void,
) {
  const state = useRef({ contribution, snapshot, running, start });
  useEffect(() => {
    state.current = { contribution, snapshot, running, start };
  }, [contribution, snapshot, running, start]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: ModelContext })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const definitions: Tool[] = [
      {
        name: 'read_weather_experiment',
        description:
          'Read the active contribution, applied conditions, elapsed model time and measured diagnostics. No changes.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: true },
        execute: () => {
          const s = state.current;
          return {
            id: s.contribution.id,
            title: s.contribution.title,
            kind: s.contribution.kind,
            parameters: s.contribution.parameters,
            hours: s.snapshot.hours,
            running: s.running,
            massPercent: s.snapshot.mass,
            meanDisplacementKm: s.snapshot.distance,
            spreadKm: s.snapshot.spread,
            meanHeightMetres: s.snapshot.meanHeight,
            heightRangeMetres: [s.snapshot.minHeight, s.snapshot.maxHeight],
            source: s.contribution.source,
          };
        },
      },
      {
        name: 'start_weather_experiment',
        description:
          'Start a reproducible new run of the active contribution with optional changed parameters. Resets model time to release. Does not alter the pinned comparison.',
        inputSchema: {
          type: 'object',
          properties: {
            wind: { type: 'number', minimum: 0, maximum: 40 },
            diffusion: { type: 'number', minimum: 0, maximum: 100000 },
            lifetime: { type: 'number', minimum: 6, maximum: 120 },
            releaseHeight: { type: 'number', minimum: 0, maximum: 12000 },
            verticalDiffusion: { type: 'number', minimum: 0, maximum: 50 },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute: async (input) => {
          if (!input || typeof input !== 'object' || Array.isArray(input))
            throw Error('Expected a parameters object.');
          const values = input as Record<string, unknown>;
          if (
            Object.keys(values).some(
              (k) =>
                ![
                  'wind',
                  'diffusion',
                  'lifetime',
                  'releaseHeight',
                  'verticalDiffusion',
                ].includes(k),
            )
          )
            throw Error('Unsupported parameter.');
          const c = validateContribution({
            ...state.current.contribution,
            parameters: { ...state.current.contribution.parameters, ...values },
          });
          state.current.start(c);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          );
          return { status: 'started', id: c.id, parameters: c.parameters };
        },
      },
    ];
    for (const tool of definitions) {
      try {
        Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability; normal UI remains available. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
