import { Dialog } from '../ui/Dialog';
import { useSession } from '@/store/useSession';
import { formatClock, formatDuration } from '@/lib/time';

interface Props {
  now: number;
}

export function ResumeDialog({ now }: Props) {
  const pending = useSession((s) => s.pendingResume);
  const accept = useSession((s) => s.acceptResume);
  const decline = useSession((s) => s.declineResume);

  if (!pending) return null;
  const remaining = Math.max(0, pending.endMs - now);
  const expired = now >= pending.endMs;

  return (
    <Dialog open={true} dismissable={false} title="Resume your session?">
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        You left a session in progress
        {pending.subject ? (
          <>
            {' '}
            for <span className="font-medium">{pending.subject}</span>
          </>
        ) : null}
        . It finishes at{' '}
        <span className="font-mono">{formatClock(pending.endMs)}</span>
        {expired ? (
          ' (already passed).'
        ) : (
          <>
            {' '}
            — {formatDuration(remaining)} still on the clock.
          </>
        )}
      </p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={accept} className="btn-primary flex-1">
          {expired ? 'See summary' : 'Resume session'}
        </button>
        <button type="button" onClick={decline} className="btn-danger flex-1">
          Start over
        </button>
      </div>
      <p className="mt-3 text-xs text-slate-500 text-center">
        "Start over" will erase this session's data.
      </p>
    </Dialog>
  );
}
