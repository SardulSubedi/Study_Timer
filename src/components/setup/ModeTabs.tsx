import type { Mode } from '@/types';

interface ModeTabsProps {
  value: Mode;
  onChange: (m: Mode) => void;
}

const OPTIONS: { id: Mode; title: string; blurb: string }[] = [
  {
    id: 'even',
    title: 'Even Breakdown',
    blurb: 'Steady, front-loaded chunks. Best for reading.',
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    blurb: 'Focus + break cycles. Best for problem sets.',
  },
  {
    id: 'adaptive',
    title: 'Adaptive Flow',
    blurb: 'Adjusts to your real pace. Best for unknowns.',
  },
];

export function ModeTabs({ value, onChange }: ModeTabsProps) {
  const selected = OPTIONS.find((o) => o.id === value);
  return (
    <div>
      <span className="label">Mode</span>
      <div
        role="tablist"
        className="inline-flex w-full items-center rounded-xl p-1 bg-slate-100 dark:bg-white/[0.04] border border-border dark:border-border-dark"
      >
        {OPTIONS.map((opt) => {
          const active = opt.id === value;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-surface dark:bg-surface-dark text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {opt.title}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{selected.blurb}</p>
      )}
    </div>
  );
}
