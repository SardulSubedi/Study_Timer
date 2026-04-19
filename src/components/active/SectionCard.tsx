import type { Section } from '@/types';
import { formatClock, msToMinutes } from '@/lib/time';

interface Props {
  section: Section;
  /**
   * Pages reported so far. Only show when there is real data:
   *  - "done" sections: the value recorded at close
   *  - "current" section: the latest logged total (or undefined if nothing logged)
   *  - "upcoming" sections: always undefined
   */
  actualCumulative?: number;
}

export function SectionCard({ section, actualCumulative }: Props) {
  const isCurrent = section.status === 'current';
  const isDone = section.status === 'done';
  const isBreak = section.type !== 'work';

  const base =
    'shrink-0 w-40 sm:w-44 rounded-xl border px-3 py-2.5 text-left transition-all';
  let stateClass = '';
  if (isCurrent) {
    stateClass =
      'bg-indigo-500/10 border-indigo-500/50 ring-2 ring-indigo-500/30';
  } else if (isDone) {
    stateClass =
      'bg-slate-100/50 dark:bg-white/[0.02] border-border dark:border-border-dark opacity-70';
  } else {
    stateClass =
      'bg-surface dark:bg-white/[0.02] border-border dark:border-border-dark';
  }
  if (isBreak && !isCurrent) {
    stateClass = 'bg-sky-500/5 border-sky-500/30';
  }

  const icon = isDone ? '✓' : isCurrent ? '▶' : isBreak ? '☕' : '';

  // Color for the actual-pages number, only meaningful for done/current and
  // when we have a value. For "current", compare against the previous
  // section's cumulative target (i.e. the floor expected at section start)
  // and the section's own end target. Sitting between them = on pace.
  let paceColor = 'text-slate-500 dark:text-slate-400';
  let delta: number | undefined;
  if (actualCumulative !== undefined) {
    if (isDone) {
      delta = actualCumulative - section.targetPagesCumulative;
    } else if (isCurrent) {
      // For current: just compare to end-of-section target (we're working towards it).
      delta = actualCumulative - section.targetPagesCumulative;
    }
    if (delta !== undefined) {
      const tolerance = Math.max(1, section.targetPagesCumulative * 0.05);
      if (Math.abs(delta) <= tolerance) {
        paceColor = 'text-amber-500 dark:text-amber-400';
      } else if (delta > 0) {
        paceColor = 'text-emerald-500 dark:text-emerald-400';
      } else {
        paceColor = 'text-rose-500 dark:text-rose-400';
      }
    }
  }

  return (
    <div className={`${base} ${stateClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          {icon} #{section.index + 1}
        </span>
        {section.adjustedFromMs && (
          <span
            className="text-[0.6rem] text-indigo-500 cursor-help"
            title={
              section.adjustmentReason
                ? `${section.adjustmentReason} (${msToMinutes(section.adjustedFromMs)}→${msToMinutes(section.endMs - section.startMs)} min)`
                : 'Section length adjusted'
            }
          >
            ↕
          </span>
        )}
      </div>
      <div className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">
        {formatClock(section.startMs)}–{formatClock(section.endMs)}
      </div>
      {isBreak ? (
        <div className="mt-2 text-xs text-sky-600 dark:text-sky-300">
          {section.type === 'long-break' ? 'Long break' : 'Short break'}
        </div>
      ) : (
        <div className="mt-2 flex items-baseline gap-2 min-h-[1.25rem]">
          <span className="num-target text-sm">{section.targetPagesCumulative}</span>
          {actualCumulative !== undefined && (
            <span className={`num-pace text-sm ${paceColor}`}>
              {actualCumulative}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
