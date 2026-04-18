import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ModeSettings, Sensitivity } from '@/types';
import { Slider } from '../ui/Slider';
import { NumberField } from '../ui/NumberField';
import { minutesToMs, msToMinutes } from '@/lib/time';

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
        />
        <Slider
          label="Max section"
          value={msToMinutes(settings.maxLen)}
          onChange={(v) => patch({ maxLen: minutesToMs(Math.max(v, msToMinutes(settings.minLen))) })}
          min={15}
          max={120}
          valueLabel={`${msToMinutes(settings.maxLen)} min`}
        />
      </div>
      <Slider
        label="Front-load"
        value={Math.round(settings.frontLoad * 100)}
        onChange={(v) => patch({ frontLoad: v / 100 })}
        min={0}
        max={50}
        valueLabel={`${Math.round(settings.frontLoad * 100)}%`}
      />
      <Slider
        label="Hidden buffer"
        value={Math.round(settings.bufferPct * 100)}
        onChange={(v) => patch({ bufferPct: v / 100 })}
        min={0}
        max={25}
        valueLabel={`${Math.round(settings.bufferPct * 100)}%`}
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
        />
      </div>
      <div>
        <span className="label">Sensitivity</span>
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
        />
        <Toggle
          label="Allow recovery mode"
          checked={settings.allowRecoveryMode}
          onChange={(v) => patch({ allowRecoveryMode: v })}
        />
      </div>
    </>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border dark:border-border-dark px-3 py-2.5 cursor-pointer">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-block w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </label>
  );
}
