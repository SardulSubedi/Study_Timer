import type { Session } from '@/types';
import { estimatedFinish, actualPagesSoFar } from '@/lib/pace';
import { formatClock, formatDuration } from '@/lib/time';

interface Props {
  session: Session;
  now: number;
}

export function CompletionFooter({ session, now }: Props) {
  const est = estimatedFinish(session, now);
  const actual = actualPagesSoFar(session);

  let delta: number | undefined;
  let status: 'ahead' | 'behind' | 'on' | 'unknown' = 'unknown';
  if (est !== undefined) {
    delta = est - session.endMs;
    if (Math.abs(delta) < 2 * 60_000) status = 'on';
    else if (delta > 0) status = 'behind';
    else status = 'ahead';
  }

  const estLabel =
    est === undefined
      ? '—'
      : actual >= session.totalPages
      ? 'Done!'
      : formatClock(est);

  return (
    <div className="text-right">
      <div className="flex items-baseline justify-end gap-3">
        <span className="small-caps">Target finish</span>
        <span className="num-target text-base">{formatClock(session.endMs)}</span>
      </div>
      <div className="flex items-baseline justify-end gap-3 mt-1">
        <span className="small-caps">Est. finish</span>
        <span
          className={`num-pace text-base ${
            status === 'behind'
              ? 'text-rose-500 dark:text-rose-400'
              : status === 'ahead'
              ? 'text-emerald-500 dark:text-emerald-400'
              : status === 'on'
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-slate-500'
          }`}
        >
          {estLabel}
          {status === 'behind' ? ' ⚠' : status === 'ahead' ? ' ✓' : ''}
        </span>
      </div>
      {delta !== undefined && status !== 'unknown' && actual < session.totalPages && (
        <div className="text-[0.7rem] mt-1 text-slate-500 dark:text-slate-400">
          {status === 'on'
            ? 'On target pace'
            : status === 'ahead'
            ? `${formatDuration(-delta)} ahead`
            : `${formatDuration(delta)} behind target`}
        </div>
      )}
    </div>
  );
}
