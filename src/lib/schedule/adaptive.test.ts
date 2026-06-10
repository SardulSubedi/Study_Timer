import { describe, expect, it } from 'vitest';
import type { Session } from '@/types';
import { DEFAULT_ADAPTIVE } from '@/types';
import { planAdaptive, rebalance } from './adaptive';
import { planEven } from './even';
import { MINUTE } from '../time';

describe('planAdaptive', () => {
  it('delegates initial plan to even breakdown', () => {
    const startMs = Date.UTC(2026, 5, 10, 12, 0, 0);
    const endMs = startMs + 90 * MINUTE;
    const input = { startMs, endMs, pages: 90, settings: DEFAULT_ADAPTIVE };
    expect(planAdaptive(input)).toEqual(planEven({ ...input, settings: DEFAULT_ADAPTIVE }));
  });
});

describe('rebalance', () => {
  const startMs = Date.UTC(2026, 5, 10, 12, 0, 0);
  const sectionMs = 30 * MINUTE;

  function makeAdaptiveSession(): Session {
    const sections = planAdaptive({
      startMs,
      endMs: startMs + 2 * sectionMs,
      pages: 100,
      settings: DEFAULT_ADAPTIVE,
    }).map((s, i) => ({
      ...s,
      index: i,
      status: i === 0 ? ('done' as const) : i === 1 ? ('current' as const) : ('upcoming' as const),
    }));
    return {
      id: 'ADP',
      createdAt: startMs,
      startMs,
      endMs: startMs + 2 * sectionMs,
      totalPages: 100,
      mode: 'adaptive',
      modeSettings: { mode: 'adaptive', adaptive: DEFAULT_ADAPTIVE },
      sections,
      progressLog: [],
      flowState: 'normal',
      popupShownFor: [],
    };
  }

  it('returns undefined for non-adaptive sessions', () => {
    const session = makeAdaptiveSession();
    session.mode = 'even';
    expect(rebalance(session, 0, startMs + sectionMs)).toBeUndefined();
  });

  it('rebuilds upcoming sections after a closed section', () => {
    const session = makeAdaptiveSession();
    const closedIdx = 0;
    const nowMs = session.sections[closedIdx].endMs;
    const closed = session.sections[closedIdx];
    session.sections[closedIdx] = {
      ...closed,
      actualPagesCumulative: 60,
      reportedAt: nowMs,
    };

    const result = rebalance(session, closedIdx, nowMs);
    expect(result).toBeDefined();
    expect(result!.sections.length).toBeGreaterThan(closedIdx + 1);
    expect(result!.sections.filter((s) => s.status === 'done').length).toBe(1);
    expect(result!.smoothedPace).toBeGreaterThan(0);
  });

  it('uses previous cumulative when section closed without logging', () => {
    const session = makeAdaptiveSession();
    const closedIdx = 0;
    const nowMs = session.sections[closedIdx].endMs;
    const beforeCount = session.sections.length;

    const result = rebalance(session, closedIdx, nowMs);
    expect(result).toBeDefined();
    expect(result!.sections.length).toBeGreaterThanOrEqual(beforeCount - 1);
    expect(result!.flowState).toMatch(/normal|flow|recovery/);
  });
});
