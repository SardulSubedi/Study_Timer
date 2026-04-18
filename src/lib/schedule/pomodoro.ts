import type { PomodoroSettings, Section, SectionType } from '@/types';

export interface PomodoroInput {
  startMs: number;
  endMs: number;
  pages: number;
  settings: PomodoroSettings;
}

/**
 * Pomodoro plan: fill the time window with [work, short, work, short, ..., work, long] cycles.
 * - Break blocks have zero page targets.
 * - Pages are distributed across WORK blocks only using front-loaded weights.
 */
export function planPomodoro({ startMs, endMs, pages, settings }: PomodoroInput): Section[] {
  const total = Math.max(0, endMs - startMs);
  if (total <= 0 || pages <= 0) return [];

  // Build the type sequence until we exceed total time.
  const sequence: { type: SectionType; dur: number }[] = [];
  let filled = 0;
  let workInCycle = 0;
  while (filled < total) {
    // Work block
    const workDur = Math.min(settings.workMs, total - filled);
    sequence.push({ type: 'work', dur: workDur });
    filled += workDur;
    workInCycle += 1;
    if (filled >= total) break;

    // Break block: long if we've hit the threshold, else short.
    const isLong = workInCycle >= settings.sessionsBeforeLong;
    const breakType: SectionType = isLong ? 'long-break' : 'short-break';
    const breakDur = Math.min(
      isLong ? settings.longBreakMs : settings.shortBreakMs,
      total - filled,
    );
    if (breakDur > 0) {
      sequence.push({ type: breakType, dur: breakDur });
      filled += breakDur;
    }
    if (isLong) workInCycle = 0;
  }

  // Distribute pages across work blocks.
  const workIdxs = sequence.map((b, i) => (b.type === 'work' ? i : -1)).filter((i) => i >= 0);
  const W = workIdxs.length;
  const weights =
    W === 1 ? [1] : workIdxs.map((_, i) => 1 - (i / (W - 1)) * settings.frontLoad);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const targetPool = pages * (1 - settings.bufferPct);

  const workDeltas = weights.map((w) => Math.max(0, Math.round((w / wSum) * targetPool)));
  const drift = Math.round(targetPool) - workDeltas.reduce((a, b) => a + b, 0);
  if (drift !== 0 && W > 0) {
    workDeltas[W - 1] = Math.max(0, workDeltas[W - 1] + drift);
  }

  const deltaByIndex = new Map<number, number>();
  workIdxs.forEach((seqIdx, i) => deltaByIndex.set(seqIdx, workDeltas[i]));

  let cursor = startMs;
  let cum = 0;
  return sequence.map((block, i) => {
    const sStart = cursor;
    const sEnd = i === sequence.length - 1 ? endMs : cursor + block.dur;
    cursor = sEnd;
    const delta = deltaByIndex.get(i) ?? 0;
    cum += delta;
    return {
      index: i,
      type: block.type,
      startMs: sStart,
      endMs: sEnd,
      targetPagesDelta: delta,
      targetPagesCumulative: cum,
      status: i === 0 ? 'current' : 'upcoming',
    } satisfies Section;
  });
}
