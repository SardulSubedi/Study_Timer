import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';

interface SliderProps {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  valueLabel?: string;
  id?: string;
  info?: { title?: string; body: ReactNode; width?: number; align?: 'start' | 'end' };
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  valueLabel,
  id,
  info,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      {label && (
        <div className="flex items-baseline justify-between mb-2 gap-2">
          <div className="flex items-center gap-1.5">
            <label htmlFor={id} className="label !mb-0">
              {label}
            </label>
            {info && (
              <InfoTooltip
                title={info.title}
                width={info.width}
                side={info.align === 'end' ? 'right' : 'left'}
              >
                {info.body}
              </InfoTooltip>
            )}
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {valueLabel ?? value}
          </span>
        </div>
      )}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
        style={{
          background: `linear-gradient(to right, rgb(99 102 241) 0%, rgb(99 102 241) ${pct}%, rgba(148,163,184,0.25) ${pct}%, rgba(148,163,184,0.25) 100%)`,
          borderRadius: 9999,
          height: 6,
          appearance: 'none',
        }}
      />
    </div>
  );
}
