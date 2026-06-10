import { describe, expect, it } from 'vitest';
import { DEFAULT_POMODORO } from '@/types';
import { planPomodoro } from './pomodoro';
import { MINUTE } from '../time';

describe('planPomodoro', () => {
  const startMs = Date.UTC(2026, 5, 10, 9, 0, 0);
  const endMs = startMs + 3 * 60 * MINUTE;

  it('alternates work and break blocks', () => {
    const sections = planPomodoro({
      startMs,
      endMs,
      pages: 60,
      settings: DEFAULT_POMODORO,
    });
    expect(sections.length).toBeGreaterThan(1);
    expect(sections[0].type).toBe('work');
    const hasBreak = sections.some((s) => s.type === 'short-break' || s.type === 'long-break');
    expect(hasBreak).toBe(true);
  });

  it('assigns zero pages to break sections', () => {
    const sections = planPomodoro({
      startMs,
      endMs,
      pages: 60,
      settings: DEFAULT_POMODORO,
    });
    for (const s of sections) {
      if (s.type !== 'work') {
        expect(s.targetPagesDelta).toBe(0);
      }
    }
  });

  it('inserts long break after sessionsBeforeLong work blocks', () => {
    const settings = {
      ...DEFAULT_POMODORO,
      workMs: 25 * MINUTE,
      shortBreakMs: 5 * MINUTE,
      longBreakMs: 20 * MINUTE,
      sessionsBeforeLong: 2,
    };
    const longWindow = startMs + 2 * (25 + 5 + 25 + 20) * MINUTE;
    const sections = planPomodoro({
      startMs,
      endMs: longWindow,
      pages: 200,
      settings,
    });
    expect(sections.some((s) => s.type === 'long-break')).toBe(true);
  });

  it('covers full session window', () => {
    const sections = planPomodoro({ startMs, endMs, pages: 40, settings: DEFAULT_POMODORO });
    expect(sections[0].startMs).toBe(startMs);
    expect(sections[sections.length - 1].endMs).toBe(endMs);
  });
});
