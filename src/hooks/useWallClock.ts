import { useEffect, useState } from 'react';

/**
 * Returns Date.now() updated every `intervalMs` milliseconds.
 * Recomputes immediately on tab refocus (visibilitychange).
 */
export function useWallClock(intervalMs: number = 250): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, intervalMs);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', tick);
    };
  }, [intervalMs]);

  return now;
}
