import { describe, expect, it } from 'vitest';
import type { Session } from '@/types';
import {
  actualPagesSoFar,
  currentSection,
  estimatedFinish,
  observedPace,
  targetPagesAt,
} from './pace';
import { MINUTE } from './time';

function makeSession(overrides: Partial<Session> = {}): Session {
  const startMs = 1_000_000;
  const endMs = startMs + 60 * MINUTE;
  return {
    id: 'TEST',
    createdAt: startMs,
    startMs,
    endMs,
    totalPages: 100,
    mode: 'even',
    modeSettings: { mode: 'even', even: { minLen: 15 * MINUTE, maxLen: 45 * MINUTE, bufferPct: 0, frontLoad: 0.2 } },
    sections: [
      {
        index: 0,
        type: 'work',
        startMs,
        endMs: startMs + 30 * MINUTE,
        targetPagesDelta: 50,
        targetPagesCumulative: 50,
        status: 'current',
      },
      {
        index: 1,
        type: 'work',
        startMs: startMs + 30 * MINUTE,
        endMs,
        targetPagesDelta: 50,
        targetPagesCumulative: 100,
        status: 'upcoming',
      },
    ],
    progressLog: [],
    flowState: 'normal',
    popupShownFor: [],
    ...overrides,
  };
}

describe('targetPagesAt', () => {
  it('returns 0 before session start', () => {
    const session = makeSession();
    expect(targetPagesAt(session, session.startMs - 1)).toBe(0);
  });

  it('interpolates within a section', () => {
    const session = makeSession();
    const mid = session.startMs + 15 * MINUTE;
    expect(targetPagesAt(session, mid)).toBeCloseTo(25, 0);
  });

  it('returns final cumulative at session end', () => {
    const session = makeSession();
    expect(targetPagesAt(session, session.endMs)).toBe(100);
  });
});

describe('observedPace and estimatedFinish', () => {
  it('returns undefined with no progress', () => {
    const session = makeSession();
    const now = session.startMs + 10 * MINUTE;
    expect(observedPace(session, now)).toBeUndefined();
    expect(estimatedFinish(session, now)).toBeUndefined();
  });

  it('projects finish from logged pace', () => {
    const session = makeSession({
      progressLog: [{ sectionIndex: 0, pagesCumulative: 25, reportedAt: 0 }],
    });
    const now = session.startMs + 10 * MINUTE;
    expect(observedPace(session, now)).toBeCloseTo(25 / (10 * MINUTE));
    expect(estimatedFinish(session, now)).toBeGreaterThan(now);
  });

  it('actualPagesSoFar reads last log entry', () => {
    const session = makeSession({
      progressLog: [
        { sectionIndex: 0, pagesCumulative: 10, reportedAt: 0 },
        { sectionIndex: 0, pagesCumulative: 30, reportedAt: 1 },
      ],
    });
    expect(actualPagesSoFar(session)).toBe(30);
  });
});

describe('currentSection', () => {
  it('finds active section by wall clock', () => {
    const session = makeSession();
    const now = session.startMs + 5 * MINUTE;
    expect(currentSection(session, now)?.index).toBe(0);
  });
});
