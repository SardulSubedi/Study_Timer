import type {
  AdaptiveSettings,
  FlowState,
  Section,
  Sensitivity,
  Session,
} from '@/types';
import { clamp, MINUTE } from '../time';
import { planEven } from './even';

export interface AdaptiveInput {
  startMs: number;
  endMs: number;
  pages: number;
  settings: AdaptiveSettings;
}

export function planAdaptive(input: AdaptiveInput): Section[] {
  return planEven({
    startMs: input.startMs,
    endMs: input.endMs,
    pages: input.pages,
    settings: input.settings,
  });
}

const THRESHOLDS: Record<Sensitivity, { fast: number; slow: number }> = {
  low: { fast: 1.35, slow: 0.7 },
  medium: { fast: 1.2, slow: 0.8 },
  high: { fast: 1.1, slow: 0.9 },
};

export interface RebalanceOutput {
  sections: Section[];
  smoothedPace: number;
  flowState: FlowState;
}

/**
 * Rebalance remaining sections based on the most recently-closed section's performance.
 *
 * @param session       current session (sections already contain updated actualPagesCumulative
 *                      for the just-closed section)
 * @param closedIndex   index of the section that just closed
 * @param nowMs         wall clock at time of rebalance
 */
export function rebalance(
  session: Session,
  closedIndex: number,
  nowMs: number,
): RebalanceOutput | undefined {
  if (session.mode !== 'adaptive') return undefined;
  const settings = (session.modeSettings as { adaptive: AdaptiveSettings }).adaptive;
  if (!settings) return undefined;

  const closed = session.sections[closedIndex];
  if (!closed) return undefined;
  const prevCum =
    closedIndex === 0 ? 0 : session.sections[closedIndex - 1].actualPagesCumulative ?? 0;
  const reportedCum = closed.actualPagesCumulative ?? prevCum;
  const reportedDelta = Math.max(0, reportedCum - prevCum);
  const sectionDur = Math.max(1, closed.endMs - closed.startMs);

  const latest = reportedDelta / sectionDur; // pages per ms
  const prev = session.smoothedPace;
  const smoothed = prev === undefined ? latest : 0.7 * prev + 0.3 * latest;

  const remainingPages = Math.max(0, session.totalPages - reportedCum);
  const remainingMs = Math.max(1, session.endMs - nowMs);
  const requiredPace = remainingPages / remainingMs;
  const ratio = requiredPace === 0 ? 1 : latest / requiredPace;

  // Determine flow/recovery based on recent section ratios.
  const recentRatios: number[] = [];
  for (let i = Math.max(0, closedIndex - 2); i <= closedIndex; i++) {
    const sec = session.sections[i];
    const sPrevCum = i === 0 ? 0 : session.sections[i - 1].actualPagesCumulative ?? 0;
    const sCum = sec.actualPagesCumulative;
    if (sCum === undefined) continue;
    const sDelta = sCum - sPrevCum;
    const sDur = Math.max(1, sec.endMs - sec.startMs);
    const sPace = sDelta / sDur;
    const sReqRemainingPages = session.totalPages - sPrevCum;
    const sReqRemainingMs = Math.max(1, session.endMs - sec.startMs);
    const sReq = sReqRemainingPages / sReqRemainingMs;
    recentRatios.push(sReq === 0 ? 1 : sPace / sReq);
  }

  let flowState: FlowState = 'normal';
  if (
    settings.allowFlowExtension &&
    recentRatios.length >= 3 &&
    recentRatios.every((r) => r >= 1.0)
  ) {
    flowState = 'flow';
  } else if (
    settings.allowRecoveryMode &&
    recentRatios.length >= 2 &&
    recentRatios.slice(-2).every((r) => r < THRESHOLDS[settings.sensitivity].slow)
  ) {
    flowState = 'recovery';
  }

  // Section length adjustment.
  const thresholds = THRESHOLDS[settings.sensitivity];
  const currentLen = closed.endMs - closed.startMs;
  let nextLen = currentLen;
  let reason = '';
  if (flowState === 'flow') {
    nextLen = clamp(currentLen + 5 * MINUTE, settings.minLen, settings.maxLen);
    if (nextLen !== currentLen) reason = 'In flow — extended section';
  } else if (flowState === 'recovery') {
    nextLen = settings.minLen;
    reason = 'Recovery mode — shorter sections';
  } else if (ratio > thresholds.fast) {
    nextLen = clamp(currentLen + 5 * MINUTE, settings.minLen, settings.maxLen);
    if (nextLen !== currentLen) reason = 'Strong pace — extended section';
  } else if (ratio < thresholds.slow) {
    nextLen = clamp(currentLen - 5 * MINUTE, settings.minLen, settings.maxLen);
    if (nextLen !== currentLen) reason = 'Behind pace — shorter section';
  }

  // Rebuild upcoming sections.
  const kept = session.sections.slice(0, closedIndex + 1);
  const rebuiltStart = closed.endMs;
  const rebuiltEnd = session.endMs;
  const rebuiltMs = Math.max(0, rebuiltEnd - rebuiltStart);
  const rebuiltSections: Section[] = [];

  if (rebuiltMs > 0 && remainingPages > 0) {
    const N = Math.max(1, Math.floor(rebuiltMs / nextLen));
    const actualSectionMs = Math.floor(rebuiltMs / N);
    // Work per section based on smoothed pace, but normalized so cumulative = remainingPages.
    const baseWorkPerSection = Math.max(0, smoothed * actualSectionMs);
    const rawTargets = Array.from({ length: N }, () => baseWorkPerSection);
    const rawSum = rawTargets.reduce((a, b) => a + b, 0) || 1;
    const scaled = rawTargets.map((v) => (v / rawSum) * remainingPages);
    const deltas = scaled.map((v) => Math.max(0, Math.round(v)));
    const drift = Math.round(remainingPages) - deltas.reduce((a, b) => a + b, 0);
    if (drift !== 0) deltas[N - 1] = Math.max(0, deltas[N - 1] + drift);

    let cum = reportedCum;
    for (let i = 0; i < N; i++) {
      cum += deltas[i];
      const sStart = rebuiltStart + i * actualSectionMs;
      const sEnd = i === N - 1 ? rebuiltEnd : rebuiltStart + (i + 1) * actualSectionMs;
      const originalLen =
        closedIndex + 1 + i < session.sections.length
          ? session.sections[closedIndex + 1 + i].endMs -
            session.sections[closedIndex + 1 + i].startMs
          : undefined;
      rebuiltSections.push({
        index: closedIndex + 1 + i,
        type: 'work',
        startMs: sStart,
        endMs: sEnd,
        targetPagesDelta: deltas[i],
        targetPagesCumulative: cum,
        status: i === 0 ? 'current' : 'upcoming',
        adjustedFromMs: originalLen !== actualSectionMs ? originalLen : undefined,
        adjustmentReason: i === 0 && reason ? reason : undefined,
      });
    }
  }

  // Re-index and set statuses cleanly on kept + rebuilt.
  const all: Section[] = [...kept, ...rebuiltSections].map((s, i) => ({
    ...s,
    index: i,
    status:
      i <= closedIndex
        ? ('done' as const)
        : i === closedIndex + 1
        ? ('current' as const)
        : ('upcoming' as const),
  }));

  return { sections: all, smoothedPace: smoothed, flowState };
}
