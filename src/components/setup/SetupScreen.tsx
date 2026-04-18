import { useMemo } from 'react';
import { useSession } from '@/store/useSession';
import {
  formatDuration,
  fromTimeInputValue,
  HOUR,
  toTimeInputValue,
} from '@/lib/time';
import { planForMode } from '@/lib/schedule';
import { TimeInput } from './TimeInput';
import { ModeTabs } from './ModeTabs';
import { ModeSettingsPanel } from './ModeSettingsPanel';
import { PlanPreview } from './PlanPreview';
import { NumberField } from '../ui/NumberField';

interface Props {
  now: number;
}

export function SetupScreen({ now }: Props) {
  const draft = useSession((s) => s.draft);
  const setDraft = useSession((s) => s.setDraft);
  const setDraftMode = useSession((s) => s.setDraftMode);
  const updateModeSettings = useSession((s) => s.updateModeSettings);
  const beginSession = useSession((s) => s.beginSession);

  const startMs = draft.startNow
    ? now
    : draft.startValue
    ? fromTimeInputValue(draft.startValue, now - 12 * HOUR)
    : now;

  const endMs = draft.endValue ? fromTimeInputValue(draft.endValue, startMs) : 0;

  const validTime = endMs > startMs + 60_000;
  const validPages = draft.pages > 0;
  const valid = validTime && validPages;

  const sections = useMemo(() => {
    if (!valid) return [];
    return planForMode({
      mode: draft.mode,
      startMs,
      endMs,
      pages: draft.pages,
      settings: draft.settings,
    });
  }, [valid, draft.mode, startMs, endMs, draft.pages, draft.settings]);

  const invalidReason = !validTime
    ? 'Finish time must be after start time.'
    : !validPages
    ? 'Set a page count greater than 0.'
    : undefined;

  const endHelper = validTime
    ? `→ ${formatDuration(endMs - startMs)} of study time`
    : undefined;

  const handleBegin = () => {
    if (!valid) return;
    beginSession({
      subject: draft.subject,
      startMs,
      endMs,
      pages: draft.pages,
      mode: draft.mode,
      settings: draft.settings,
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Plan your session
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Tell the timer where you need to finish and how much you need to cover. It'll do the pacing.
        </p>
      </div>

      <div className="card p-6 sm:p-7 space-y-6">
        <div>
          <label htmlFor="subject" className="label">
            Subject <span className="text-slate-400 normal-case font-normal">(optional)</span>
          </label>
          <input
            id="subject"
            type="text"
            value={draft.subject}
            onChange={(e) => setDraft({ subject: e.target.value })}
            placeholder="e.g. Organic Chemistry Ch. 4–7"
            className="input"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="label !mb-0">Start</span>
            <div
              className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-white/[0.04] border border-border dark:border-border-dark text-xs"
            >
              <button
                type="button"
                onClick={() =>
                  setDraft({ startNow: true, startValue: toTimeInputValue(now) })
                }
                className={`px-2.5 py-1 rounded-md font-medium ${
                  draft.startNow
                    ? 'bg-surface dark:bg-surface-dark text-indigo-500'
                    : 'text-slate-500'
                }`}
              >
                Start now
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    startNow: false,
                    startValue:
                      draft.startValue || toTimeInputValue(now),
                  })
                }
                className={`px-2.5 py-1 rounded-md font-medium ${
                  !draft.startNow
                    ? 'bg-surface dark:bg-surface-dark text-indigo-500'
                    : 'text-slate-500'
                }`}
              >
                Scheduled
              </button>
            </div>
          </div>
          {draft.startNow ? (
            <div className="input flex items-center font-mono text-lg text-slate-500 dark:text-slate-400">
              {toTimeInputValue(now)} <span className="ml-2 text-xs">(now)</span>
            </div>
          ) : (
            <input
              type="time"
              value={draft.startValue}
              onChange={(e) => setDraft({ startValue: e.target.value })}
              className="input font-mono text-lg"
              step={60}
            />
          )}
        </div>

        <TimeInput
          label="Finish by"
          value={draft.endValue}
          onChange={(v) => setDraft({ endValue: v })}
          helper={endHelper}
          id="end-time"
        />

        <NumberField
          label="Pages / sections to cover"
          value={draft.pages}
          onChange={(v) => setDraft({ pages: Math.max(0, Math.round(v)) })}
          min={1}
          max={10000}
          step={1}
        />

        <ModeTabs value={draft.mode} onChange={setDraftMode} />

        <ModeSettingsPanel settings={draft.settings} onChange={updateModeSettings} />
      </div>

      <PlanPreview
        sections={sections}
        totalPages={draft.pages}
        startMs={startMs}
        endMs={endMs || startMs}
      />

      <div className="sticky bottom-4 z-10">
        <button
          type="button"
          onClick={handleBegin}
          disabled={!valid}
          title={invalidReason}
          className="btn-primary w-full text-base py-3.5"
        >
          Begin Session →
        </button>
        {!valid && invalidReason && (
          <p className="mt-2 text-xs text-center text-rose-500">{invalidReason}</p>
        )}
      </div>
    </div>
  );
}
