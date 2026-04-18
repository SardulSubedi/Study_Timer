export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Format a duration (ms) as "H:MM:SS" if >=1h, else "M:SS". Negative clamps to 0. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Format a duration (ms) as a compact human string: "3h 42m" or "42m" or "58s". */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) return m === 0 ? `${h}h` : `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${total}s`;
}

/** Format an epoch ms as "h:MM AM/PM". */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/** Format an epoch ms as "HH:MM" for <input type="time">. */
export function toTimeInputValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/**
 * Parse a "HH:MM" string from a time input into an epoch ms on the given reference day.
 * If the resulting time is earlier than `after`, roll forward by one day.
 */
export function fromTimeInputValue(value: string, after: number): number {
  const [hStr, mStr] = value.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return after;
  const ref = new Date(after);
  const candidate = new Date(
    ref.getFullYear(),
    ref.getMonth(),
    ref.getDate(),
    h,
    m,
    0,
    0,
  ).getTime();
  if (candidate <= after) return candidate + 24 * HOUR;
  return candidate;
}

export function minutesToMs(min: number): number {
  return Math.round(min * MINUTE);
}

export function msToMinutes(ms: number): number {
  return Math.round(ms / MINUTE);
}
