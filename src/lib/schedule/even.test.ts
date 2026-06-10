import { describe, expect, it } from 'vitest';
import { DEFAULT_EVEN } from '@/types';
import { planEven } from './even';
import { MINUTE } from '../time';

describe('planEven', () => {
  const startMs = Date.UTC(2026, 5, 10, 12, 0, 0);
  const endMs = startMs + 2 * 60 * MINUTE; // 2 hours

  it('returns empty for invalid input', () => {
    expect(planEven({ startMs, endMs: startMs, pages: 100, settings: DEFAULT_EVEN })).toEqual([]);
    expect(planEven({ startMs, endMs, pages: 0, settings: DEFAULT_EVEN })).toEqual([]);
  });

  it('clamps section length to min/max settings', () => {
    const sections = planEven({
      startMs,
      endMs,
      pages: 100,
      settings: { ...DEFAULT_EVEN, minLen: 20 * MINUTE, maxLen: 30 * MINUTE },
    });
    for (const s of sections) {
      const len = s.endMs - s.startMs;
      expect(len).toBeGreaterThanOrEqual(20 * MINUTE - 1);
      expect(len).toBeLessThanOrEqual(30 * MINUTE + 1);
    }
  });

  it('distributes pages with front-loading', () => {
    const sections = planEven({
      startMs,
      endMs,
      pages: 100,
      settings: { ...DEFAULT_EVEN, frontLoad: 0.3, bufferPct: 0 },
    });
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].targetPagesDelta).toBeGreaterThan(
      sections[sections.length - 1].targetPagesDelta,
    );
    expect(sections[sections.length - 1].targetPagesCumulative).toBe(100);
  });

  it('withholds buffer pages from targets', () => {
    const sections = planEven({
      startMs,
      endMs,
      pages: 100,
      settings: { ...DEFAULT_EVEN, bufferPct: 0.1, frontLoad: 0 },
    });
    const assigned = sections[sections.length - 1].targetPagesCumulative;
    expect(assigned).toBeLessThanOrEqual(90);
  });

  it('last section ends exactly at session end', () => {
    const sections = planEven({ startMs, endMs, pages: 50, settings: DEFAULT_EVEN });
    expect(sections[sections.length - 1].endMs).toBe(endMs);
    expect(sections[0].startMs).toBe(startMs);
  });
});
