import type { Section } from '@/types';
import { formatClock, formatDuration } from '@/lib/time';

interface Props {
  sections: Section[];
  totalPages: number;
  startMs: number;
  endMs: number;
}

export function PlanPreview({ sections, totalPages, startMs, endMs }: Props) {
  if (sections.length === 0) {
    return (
      <div className="subtle-card p-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Enter your times and page count to see the plan.
      </div>
    );
  }

  const totalMs = endMs - startMs;
  const workCount = sections.filter((s) => s.type === 'work').length;

  return (
    <div className="subtle-card p-5 space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Plan preview
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {workCount} work {workCount === 1 ? 'block' : 'blocks'}
          {sections.length !== workCount &&
            ` · ${sections.length - workCount} breaks`}{' '}
          · {formatDuration(totalMs)} · {totalPages} pages
        </p>
      </div>

      {/* Horizontal proportional bar of sections */}
      <div className="flex w-full h-10 rounded-lg overflow-hidden ring-1 ring-border dark:ring-border-dark">
        {sections.map((s) => {
          const width = ((s.endMs - s.startMs) / totalMs) * 100;
          const color =
            s.type === 'work'
              ? 'bg-indigo-500/80 hover:bg-indigo-500'
              : s.type === 'short-break'
              ? 'bg-sky-400/70 hover:bg-sky-400'
              : 'bg-sky-500/80 hover:bg-sky-500';
          return (
            <div
              key={s.index}
              title={`${s.type} · ${formatClock(s.startMs)}–${formatClock(s.endMs)}${
                s.type === 'work' ? ` · ${s.targetPagesDelta}p` : ''
              }`}
              style={{ width: `${width}%` }}
              className={`${color} transition-colors`}
            />
          );
        })}
      </div>

      {/* Compact list (first 8 + ellipsis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
        {sections.slice(0, 8).map((s) => (
          <div
            key={s.index}
            className="flex justify-between items-center px-3 py-1.5 rounded-md bg-black/5 dark:bg-white/[0.03]"
          >
            <span className="text-slate-500 dark:text-slate-400">
              {s.index + 1}.{' '}
              {s.type === 'work' ? '' : s.type === 'short-break' ? 'short brk ' : 'long brk '}
            </span>
            <span className="text-slate-600 dark:text-slate-300">
              {formatClock(s.startMs)}–{formatClock(s.endMs)}
            </span>
            <span className="text-slate-900 dark:text-slate-100">
              {s.type === 'work' ? `${s.targetPagesDelta}p` : '—'}
            </span>
          </div>
        ))}
        {sections.length > 8 && (
          <div className="col-span-full text-center text-slate-500">
            +{sections.length - 8} more…
          </div>
        )}
      </div>
    </div>
  );
}
