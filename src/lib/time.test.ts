import { describe, expect, it } from 'vitest';
import {
  clamp,
  formatCountdown,
  formatDuration,
  fromTimeInputValue,
  HOUR,
  MINUTE,
  toTimeInputValue,
} from './time';

describe('clamp', () => {
  it('clamps between min and max', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('formatCountdown', () => {
  it('formats sub-hour durations', () => {
    expect(formatCountdown(90_000)).toBe('1:30');
  });

  it('formats hour+ durations', () => {
    expect(formatCountdown(3_661_000)).toBe('1:01:01');
  });

  it('clamps negative to zero', () => {
    expect(formatCountdown(-1000)).toBe('0:00');
  });
});

describe('formatDuration', () => {
  it('formats hours and minutes', () => {
    expect(formatDuration(2 * HOUR + 30 * MINUTE)).toBe('2h 30m');
  });

  it('formats seconds when under a minute', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });
});

describe('fromTimeInputValue', () => {
  const noon = new Date(2026, 5, 10, 12, 0, 0, 0).getTime();

  it('parses same-day time after reference', () => {
    const result = fromTimeInputValue('18:30', noon);
    expect(new Date(result).getHours()).toBe(18);
    expect(new Date(result).getMinutes()).toBe(30);
    expect(result).toBeGreaterThan(noon);
  });

  it('rolls forward one day when time is earlier than reference', () => {
    const result = fromTimeInputValue('09:00', noon);
    expect(result - noon).toBe(21 * HOUR);
  });

  it('round-trips with toTimeInputValue on same day', () => {
    const ms = fromTimeInputValue('14:15', noon);
    expect(toTimeInputValue(ms)).toBe('14:15');
  });
});
