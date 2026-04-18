import type { Section, Session } from '@/types';

/** Interpolate the expected target page at an arbitrary point in time. */
export function targetPagesAt(session: Session, nowMs: number): number {
  if (nowMs <= session.startMs) return 0;
  if (nowMs >= session.endMs) {
    const last = session.sections[session.sections.length - 1];
    return last?.targetPagesCumulative ?? session.totalPages;
  }
  const section = session.sections.find((s) => nowMs >= s.startMs && nowMs < s.endMs);
  if (!section) return 0;
  const prevCum =
    section.index === 0
      ? 0
      : session.sections[section.index - 1].targetPagesCumulative;
  const sectionDur = section.endMs - section.startMs;
  if (sectionDur <= 0) return section.targetPagesCumulative;
  const frac = (nowMs - section.startMs) / sectionDur;
  return prevCum + frac * section.targetPagesDelta;
}

/** Cumulative pages actually reported so far (the last reported value in progress log). */
export function actualPagesSoFar(session: Session): number {
  if (session.progressLog.length === 0) return 0;
  return session.progressLog[session.progressLog.length - 1].pagesCumulative;
}

/** Observed pace in pages per ms, based on the progress log. */
export function observedPace(session: Session, nowMs: number): number | undefined {
  const cum = actualPagesSoFar(session);
  const elapsed = Math.max(1, nowMs - session.startMs);
  if (cum <= 0) return undefined;
  return cum / elapsed;
}

/**
 * Project where the user is currently relative to the plan, in pages.
 * If no progress reported yet, returns undefined.
 */
export function projectedPagesAt(session: Session, nowMs: number): number | undefined {
  const pace = observedPace(session, nowMs);
  if (pace === undefined) return undefined;
  return pace * (nowMs - session.startMs);
}

/**
 * Estimated completion time (epoch ms) based on observed pace.
 * Undefined if no pace data yet.
 */
export function estimatedFinish(session: Session, nowMs: number): number | undefined {
  const cum = actualPagesSoFar(session);
  const pace = observedPace(session, nowMs);
  if (pace === undefined || pace <= 0) return undefined;
  const remaining = session.totalPages - cum;
  if (remaining <= 0) return nowMs;
  return nowMs + remaining / pace;
}

/** Current section derived from now. Returns undefined if session hasn't started or is over. */
export function currentSection(session: Session, nowMs: number): Section | undefined {
  if (nowMs < session.startMs) return session.sections[0];
  return session.sections.find((s) => nowMs >= s.startMs && nowMs < s.endMs);
}

/** Index of section whose endMs has just passed relative to nowMs; i.e. most recent completed section. */
export function lastCompletedIndex(session: Session, nowMs: number): number {
  let idx = -1;
  for (const s of session.sections) {
    if (nowMs >= s.endMs) idx = s.index;
    else break;
  }
  return idx;
}
