import type { ReactNode } from 'react';
import type { Mode } from '@/types';
import { InfoTooltip } from '../ui/InfoTooltip';

interface ModeTabsProps {
  value: Mode;
  onChange: (m: Mode) => void;
}

interface OptionDef {
  id: Mode;
  title: string;
  blurb: string;
  detail: ReactNode;
}

const OPTIONS: OptionDef[] = [
  {
    id: 'even',
    title: 'Even Breakdown',
    blurb: 'Steady, front-loaded chunks. Best for reading.',
    detail: (
      <>
        <p>
          Splits your time into equal-length sections (auto-sized between your min and max), with
          slightly heavier page targets in the early sections.
        </p>
        <p className="text-slate-500">
          The plan is fixed once you start — your pace is shown but doesn't change targets.
        </p>
      </>
    ),
  },
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    blurb: 'Focus + break cycles. Best for problem sets.',
    detail: (
      <>
        <p>
          Alternates work blocks (default 25 min) with short breaks (5 min), and a longer break (20
          min) every 4 work blocks.
        </p>
        <p className="text-slate-500">
          Pages are distributed across work blocks only. Breaks have no targets.
        </p>
      </>
    ),
  },
  {
    id: 'adaptive',
    title: 'Adaptive Flow',
    blurb: 'Adjusts to your real pace. Best for unknowns.',
    detail: (
      <>
        <p>
          Starts like Even Breakdown, but rebalances upcoming sections after each progress report.
        </p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Strong pace → next sections get longer.</li>
          <li>Slow pace → next sections get shorter.</li>
          <li>3 strong sections in a row → "in flow", popups suppressed.</li>
          <li>2 weak sections in a row → "recovery", smallest sections.</li>
        </ul>
      </>
    ),
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
        <div className="mt-2 flex items-center gap-1.5">
          <p className="text-xs text-slate-500 dark:text-slate-400">{selected.blurb}</p>
          <InfoTooltip title={selected.title} width={300}>
            {selected.detail}
          </InfoTooltip>
        </div>
      )}
    </div>
  );
}
