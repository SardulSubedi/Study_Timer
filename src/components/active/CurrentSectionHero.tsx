import { useMemo } from 'react';
import type { Section, Session } from '@/types';
import { formatClock, formatCountdown } from '@/lib/time';
import { actualPagesSoFar } from '@/lib/pace';

interface Props {
  session: Session;
  current: Section;
  now: number;
  onLogClick: () => void;
}

export function CurrentSectionHero({ session, current, now, onLogClick }: Props) {
  const remaining = Math.max(0, current.endMs - now);
  const sectionDur = Math.max(1, current.endMs - current.startMs);
  const timeFrac = Math.min(
    1,
    Math.max(0, (now - current.startMs) / sectionDur),
  );

  const isBreak = current.type !== 'work';

  // Targets and pace
  const prevTargetCum =
    current.index === 0 ? 0 : session.sections[current.index - 1].targetPagesCumulative;
  const sectionTargetEnd = current.targetPagesCumulative;

  const actualCum = actualPagesSoFar(session);
  const workIdx = useMemo(
    () => session.sections.slice(0, current.index + 1).filter((s) => s.type === 'work').length,
    [session.sections, current.index],
  );
  const workTotal = useMemo(
    () => session.sections.filter((s) => s.type === 'work').length,
    [session.sections],
  );

  // Where is user's pace within this section's range?
  const totalRange = Math.max(1, sectionTargetEnd - prevTargetCum);
  const paceInSection = actualCum - prevTargetCum;
  const paceFrac = Math.min(1, Math.max(0, paceInSection / totalRange));

  // Debt = pace tick minus time fill; if pace ahead -> positive -> emerald
  const debt = paceFrac - timeFrac;
  const debtColor =
    Math.abs(debt) < 0.03 ? 'amber' : debt > 0 ? 'emerald' : 'rose';

  const sectionLabel = isBreak
    ? current.type === 'long-break'
      ? 'Long break'
      : 'Short break'
    : `Section ${workIdx} of ${workTotal}`;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <div className="small-caps">{sectionLabel}</div>
          <div className="font-mono text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {formatClock(current.startMs)}–{formatClock(current.endMs)}
          </div>
        </div>
        {!isBreak && (
          <button type="button" onClick={onLogClick} className="btn-secondary text-xs">
            Log progress
          </button>
        )}
      </div>

      {/* Countdown */}
      <div
        aria-live="polite"
        className="font-mono tabular-nums text-6xl sm:text-8xl font-semibold leading-none tracking-tight text-center my-6"
      >
        {formatCountdown(remaining)}
      </div>

      {/* Dual-fill progress bar */}
      <div className="relative h-4 rounded-full bg-slate-200/70 dark:bg-white/[0.06] overflow-hidden ring-1 ring-border dark:ring-border-dark">
        {/* Hidden-buffer stripe overlay on the last 10% */}
        <div className="absolute inset-y-0 right-0 w-[10%] buffer-stripes opacity-60 pointer-events-none" />

        {/* Time fill */}
        <div
          className={`absolute inset-y-0 left-0 ${
            isBreak ? 'bg-sky-500/80' : 'bg-indigo-500'
          } transition-[width] duration-300 ease-linear`}
          style={{ width: `${timeFrac * 100}%` }}
        >
          {!isBreak && (
            <div className="absolute inset-0 stripes animate-stripes opacity-30" />
          )}
        </div>

        {/* Debt shading between time fill and pace tick (work only, with progress) */}
        {!isBreak && actualCum > 0 && (
          <div
            className={`absolute inset-y-0 ${
              debtColor === 'emerald'
                ? 'bg-emerald-400/30'
                : debtColor === 'rose'
                ? 'bg-rose-400/30'
                : 'bg-amber-400/30'
            }`}
            style={{
              left: `${Math.min(timeFrac, paceFrac) * 100}%`,
              width: `${Math.abs(paceFrac - timeFrac) * 100}%`,
            }}
          />
        )}

        {/* Pace tick */}
        {!isBreak && actualCum > 0 && (
          <div
            className={`absolute top-0 bottom-0 w-0.5 ${
              debtColor === 'emerald'
                ? 'bg-emerald-400'
                : debtColor === 'rose'
                ? 'bg-rose-400'
                : 'bg-amber-400'
            }`}
            style={{ left: `calc(${paceFrac * 100}% - 1px)` }}
            title={`Pace: ${actualCum} pages`}
          />
        )}
      </div>

      {/* Target vs Pace row */}
      {!isBreak ? (
        <div className="mt-6 flex items-end justify-center gap-10">
          <div className="text-center">
            <div className="small-caps">Target</div>
            <div className="num-target text-3xl sm:text-4xl mt-1">
              {sectionTargetEnd}
            </div>
            <div className="text-[0.7rem] text-slate-500 dark:text-slate-500 mt-1">
              by section end
            </div>
          </div>
          <div className="text-center">
            <div className="small-caps">Pace</div>
            <div
              className={`num-pace text-3xl sm:text-4xl mt-1 ${
                debtColor === 'emerald'
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : debtColor === 'rose'
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-amber-500 dark:text-amber-400'
              }`}
            >
              {actualCum || '—'}
            </div>
            <div className="text-[0.7rem] text-slate-500 dark:text-slate-500 mt-1">
              right now
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Take a breather. The timer keeps going — come back when you hear the next section.
        </div>
      )}
    </div>
  );
}
