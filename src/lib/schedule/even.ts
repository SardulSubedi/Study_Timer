import type { EvenSettings, Section } from '@/types';
import { clamp } from '../time';

export interface EvenInput {
  startMs: number;
  endMs: number;
  pages: number;
  settings: EvenSettings;
}

/**
 * Plan a session with Even Breakdown:
 *  - section length = clamp(0.04 * totalMs, minLen, maxLen)
 *  - N = floor(totalMs / sectionLen), last section absorbs remainder
 *  - page targets use normalized front-loaded weights (1 - i/(N-1) * frontLoad)
 *  - hidden buffer: only (1 - bufferPct) of pages are distributed as hard targets
 */
export function planEven({ startMs, endMs, pages, settings }: EvenInput): Section[] {
  const total = Math.max(0, endMs - startMs);
  if (total <= 0 || pages <= 0) return [];

  const raw = 0.04 * total;
  const sectionMs = Math.round(clamp(raw, settings.minLen, settings.maxLen));
  const N = Math.max(1, Math.floor(total / sectionMs));

  const weights =
    N === 1
      ? [1]
      : Array.from({ length: N }, (_, i) => 1 - (i / (N - 1)) * settings.frontLoad);
  const wSum = weights.reduce((a, b) => a + b, 0);

  const targetPool = pages * (1 - settings.bufferPct);

  // First distribute with rounding, then fix drift on the last section.
  const deltas: number[] = Array.from({ length: N }, (_, i) =>
    Math.max(0, Math.round((weights[i] / wSum) * targetPool)),
  );
  const sumDeltas = deltas.reduce((a, b) => a + b, 0);
  // Reserve buffer deliberately; do not push it back into deltas.
  // Any rounding drift away from targetPool is absorbed on the final section.
  const drift = Math.round(targetPool) - sumDeltas;
  if (drift !== 0) deltas[N - 1] = Math.max(0, deltas[N - 1] + drift);

  let cum = 0;
  return Array.from({ length: N }, (_, i) => {
    cum += deltas[i];
    const sStart = startMs + i * sectionMs;
    const sEnd = i === N - 1 ? endMs : startMs + (i + 1) * sectionMs;
    return {
      index: i,
      type: 'work' as const,
      startMs: sStart,
      endMs: sEnd,
      targetPagesDelta: deltas[i],
      targetPagesCumulative: cum,
      status: i === 0 ? 'current' : 'upcoming',
    } satisfies Section;
  });
}
