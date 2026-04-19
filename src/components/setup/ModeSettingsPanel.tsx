import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ModeSettings, Sensitivity } from '@/types';
import { Slider } from '../ui/Slider';
import { NumberField } from '../ui/NumberField';
import { InfoTooltip } from '../ui/InfoTooltip';
import { minutesToMs, msToMinutes } from '@/lib/time';

const INFO = {
  minSection: {
    title: 'Minimum section length',
    body: (
      <>
        <p>The shortest a single section can be. Section length auto-scales to your total time, but never drops below this.</p>
        <p className="text-slate-500">Shorter = more frequent check-ins. Longer = deeper focus.</p>
      </>
    ),
  },
  maxSection: {
    title: 'Maximum section length',
    body: (
      <>
        <p>The longest a single section can be. Caps the auto-scaled length so blocks stay digestible.</p>
        <p className="text-slate-500">45 min is a good default — long enough to dig in, short enough to recover from a slump.</p>
      </>
    ),
  },
  frontLoad: {
    title: 'Front-load',
    width: 280,
    body: (
      <>
        <p>How much heavier early sections are than later ones. People are usually faster and sharper at the start.</p>
        <p>At <strong>20%</strong>, the last section's page target is about 20% lighter than the first.</p>
        <p className="text-slate-500">Set to 0% for perfectly even targets.</p>
      </>
    ),
  },
  buffer: {
    title: 'Hidden buffer',
    width: 300,
    body: (
      <>
        <p>
          This controls how much of your <strong>page goal</strong> is shown in the per-section targets. The app only splits pages
          into those targets — it does not track “extra” reading elsewhere.
        </p>
        <p>
          <strong>0% (default)</strong> — Your full goal is divided across sections. If you hit every section target, you have
          completed the number of pages you entered.
        </p>
        <p>
          <strong>Above 0%</strong> — That fraction is <em>not</em> assigned to any section. Sections show targets that add up to
          less than your total (e.g. at 10%, targets cover 90% of your pages). The rest is slack: useful if you want softer goals
          or to leave room for interruptions without the plan looking like you are behind.
        </p>
      </>
    ),
  },
  sensitivity: {
    title: 'Sensitivity',
    width: 280,
    body: (
      <>
        <p>How quickly Adaptive mode reacts to a fast or slow section.</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><strong>Low</strong> — only reacts to large pace changes (35%+).</li>
          <li><strong>Medium</strong> — reacts at 20% off pace.</li>
          <li><strong>High</strong> — reacts at 10% off pace.</li>
        </ul>
        <p className="text-slate-500">High sensitivity means more frequent length adjustments.</p>
      </>
    ),
  },
  flowExt: {
    title: 'Flow extension',
    width: 280,
    body: (
      <>
        <p>If you hit pace 3 sections in a row, Adaptive mode extends the next section and stops popping the progress prompt.</p>
        <p className="text-slate-500">Lets you stay in deep focus when things are clicking.</p>
      </>
    ),
  },
  recovery: {
    title: 'Recovery mode',
    width: 280,
    body: (
      <>
        <p>If you fall well behind for 2 sections in a row, Adaptive mode shrinks future sections to your minimum length.</p>
        <p className="text-slate-500">Smaller chunks make it easier to find footing again instead of staring down a long block.</p>
      </>
    ),
  },
  pomodoroSessions: {
    title: 'Sessions before long break',
    width: 280,
    body: (
      <p>How many work blocks happen before you get the long break instead of a short one. Standard Pomodoro is 4.</p>
    ),
  },
};

interface Props {
  settings: ModeSettings;
  onChange: (patch: Partial<ModeSettings>) => void;
}

export function ModeSettingsPanel({ settings, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-sm text-indigo-500 hover:text-indigo-400 font-medium inline-flex items-center gap-1"
      >
        <span
          className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        >
          ▸
        </span>
        Customize
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="subtle-card p-4 mt-3 space-y-5">
              {settings.mode === 'even' && (
                <EvenFields settings={settings.even} onChange={onChange} />
              )}
              {settings.mode === 'pomodoro' && (
                <PomodoroFields settings={settings.pomodoro} onChange={onChange} />
              )}
              {settings.mode === 'adaptive' && (
                <AdaptiveFields settings={settings.adaptive} onChange={onChange} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvenFields({
  settings,
  onChange,
}: {
  settings: NonNullable<(ModeSettings & { mode: 'even' })['even']>;
  onChange: (patch: Partial<ModeSettings>) => void;
}) {
  const patch = (p: Partial<typeof settings>) =>
    onChange({ even: p } as unknown as Partial<ModeSettings>);
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Slider
          label="Min section"
          value={msToMinutes(settings.minLen)}
          onChange={(v) => patch({ minLen: minutesToMs(Math.min(v, msToMinutes(settings.maxLen))) })}
          min={5}
          max={60}
          valueLabel={`${msToMinutes(settings.minLen)} min`}
          info={INFO.minSection}
        />
        <Slider
          label="Max section"
          value={msToMinutes(settings.maxLen)}
          onChange={(v) => patch({ maxLen: minutesToMs(Math.max(v, msToMinutes(settings.minLen))) })}
          min={15}
          max={120}
          valueLabel={`${msToMinutes(settings.maxLen)} min`}
          info={{ ...INFO.maxSection, align: 'end' }}
        />
      </div>
      <Slider
        label="Front-load"
        value={Math.round(settings.frontLoad * 100)}
        onChange={(v) => patch({ frontLoad: v / 100 })}
        min={0}
        max={50}
        valueLabel={`${Math.round(settings.frontLoad * 100)}%`}
        info={INFO.frontLoad}
      />
      <Slider
        label="Hidden buffer"
        value={Math.round(settings.bufferPct * 100)}
        onChange={(v) => patch({ bufferPct: v / 100 })}
        min={0}
        max={25}
        valueLabel={`${Math.round(settings.bufferPct * 100)}%`}
        info={INFO.buffer}
      />
    </>
  );
}

function PomodoroFields({
  settings,
  onChange,
}: {
  settings: NonNullable<(ModeSettings & { mode: 'pomodoro' })['pomodoro']>;
  onChange: (patch: Partial<ModeSettings>) => void;
}) {
  const patch = (p: Partial<typeof settings>) =>
    onChange({ pomodoro: p } as unknown as Partial<ModeSettings>);
  return (
    <div className="grid grid-cols-2 gap-4">
      <NumberField
        label="Work"
        value={msToMinutes(settings.workMs)}
        onChange={(v) => patch({ workMs: minutesToMs(v) })}
        min={5}
        max={90}
        suffix="min"
      />
      <NumberField
        label="Short break"
        value={msToMinutes(settings.shortBreakMs)}
        onChange={(v) => patch({ shortBreakMs: minutesToMs(v) })}
        min={1}
        max={30}
        suffix="min"
      />
      <NumberField
        label="Long break"
        value={msToMinutes(settings.longBreakMs)}
        onChange={(v) => patch({ longBreakMs: minutesToMs(v) })}
        min={5}
        max={60}
        suffix="min"
      />
      <NumberField
        label="Sessions before long break"
        value={settings.sessionsBeforeLong}
        onChange={(v) => patch({ sessionsBeforeLong: v })}
        min={2}
        max={10}
        info={INFO.pomodoroSessions}
      />
    </div>
  );
}

function AdaptiveFields({
  settings,
  onChange,
}: {
  settings: NonNullable<(ModeSettings & { mode: 'adaptive' })['adaptive']>;
  onChange: (patch: Partial<ModeSettings>) => void;
}) {
  const patch = (p: Partial<typeof settings>) =>
    onChange({ adaptive: p } as unknown as Partial<ModeSettings>);
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Slider
          label="Min section"
          value={msToMinutes(settings.minLen)}
          onChange={(v) =>
            patch({ minLen: minutesToMs(Math.min(v, msToMinutes(settings.maxLen))) })
          }
          min={5}
          max={60}
          valueLabel={`${msToMinutes(settings.minLen)} min`}
          info={INFO.minSection}
        />
        <Slider
          label="Max section"
          value={msToMinutes(settings.maxLen)}
          onChange={(v) =>
            patch({ maxLen: minutesToMs(Math.max(v, msToMinutes(settings.minLen))) })
          }
          min={15}
          max={120}
          valueLabel={`${msToMinutes(settings.maxLen)} min`}
          info={{ ...INFO.maxSection, align: 'end' }}
        />
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="label !mb-0">Sensitivity</span>
          <InfoTooltip title={INFO.sensitivity.title} width={INFO.sensitivity.width}>
            {INFO.sensitivity.body}
          </InfoTooltip>
        </div>
        <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-white/[0.04] border border-border dark:border-border-dark">
          {(['low', 'medium', 'high'] as Sensitivity[]).map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => patch({ sensitivity: s })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                settings.sensitivity === s
                  ? 'bg-surface dark:bg-surface-dark text-indigo-500'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Toggle
          label="Allow flow extension"
          checked={settings.allowFlowExtension}
          onChange={(v) => patch({ allowFlowExtension: v })}
          info={INFO.flowExt}
        />
        <Toggle
          label="Allow recovery mode"
          checked={settings.allowRecoveryMode}
          onChange={(v) => patch({ allowRecoveryMode: v })}
          info={INFO.recovery}
        />
      </div>
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  info,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  info?: { title?: string; body: React.ReactNode; width?: number };
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border dark:border-border-dark px-3 py-2.5">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="text-sm text-slate-700 dark:text-slate-200 cursor-pointer truncate"
          onClick={() => onChange(!checked)}
        >
          {label}
        </span>
        {info && (
          <InfoTooltip title={info.title} width={info.width}>
            {info.body}
          </InfoTooltip>
        )}
      </div>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-9 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${
          checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </div>
  );
}
