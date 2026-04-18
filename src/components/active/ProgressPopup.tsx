import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Session } from '@/types';
import { actualPagesSoFar } from '@/lib/pace';

interface Props {
  session: Session;
  /** Index of the section that just closed and triggered the popup. Null = closed. */
  openForSectionIndex: number | null;
  /** Manual trigger: open a logging popup for the current section, not a just-closed one. */
  manualMode?: boolean;
  onSave: (pagesCumulative: number) => void;
  onSkip: () => void;
}

export function ProgressPopup({
  session,
  openForSectionIndex,
  manualMode = false,
  onSave,
  onSkip,
}: Props) {
  const sectionIndex = openForSectionIndex ?? -1;
  const section = sectionIndex >= 0 ? session.sections[sectionIndex] : undefined;
  const lastCum = actualPagesSoFar(session);
  const suggested = section
    ? Math.max(lastCum, section.targetPagesCumulative)
    : lastCum;
  const [value, setValue] = useState<number>(suggested);

  useEffect(() => {
    setValue(suggested);
  }, [suggested, sectionIndex]);

  useEffect(() => {
    if (openForSectionIndex === null || manualMode) return;
    // Auto-dismiss after 45 seconds for section-end popups.
    const t = window.setTimeout(() => onSkip(), 45_000);
    return () => window.clearTimeout(t);
  }, [openForSectionIndex, manualMode, onSkip]);

  const open = openForSectionIndex !== null;
  const titleText = manualMode
    ? 'Log progress'
    : section
    ? `Section ${section.index + 1} wrapped`
    : 'Log progress';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[22rem] z-40 card p-4 shadow-glow"
          role="dialog"
          aria-label={titleText}
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold">{titleText}</h3>
            <button
              type="button"
              onClick={onSkip}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            How many pages are you on? This is optional — it helps the pace display stay accurate.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={session.totalPages}
              value={Number.isFinite(value) ? value : ''}
              onChange={(e) => setValue(Number(e.target.value))}
              className="input font-mono text-lg flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave(value);
              }}
            />
            <span className="text-xs text-slate-500">
              / {session.totalPages}
            </span>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={onSkip} className="btn-ghost flex-1">
              Skip
            </button>
            <button
              type="button"
              onClick={() => onSave(value)}
              className="btn-primary flex-1"
            >
              Save
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
