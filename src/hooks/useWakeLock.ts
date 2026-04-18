import { useEffect, useRef } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
}

interface WakeLockApi {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/**
 * Request a Screen Wake Lock while `active` is true. Silently falls back on unsupported browsers.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  useEffect(() => {
    const wakeLock = (navigator as unknown as { wakeLock?: WakeLockApi }).wakeLock;
    if (!active || !wakeLock) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await wakeLock.request('screen');
        if (cancelled) {
          sentinel.release().catch(() => undefined);
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        // Permission denied or unsupported — no-op.
      }
    };

    acquire();

    const onVis = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) acquire();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      sentinelRef.current?.release().catch(() => undefined);
      sentinelRef.current = null;
    };
  }, [active]);
}
