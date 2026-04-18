import { useEffect, useState } from 'react';

interface NumberFieldProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  label?: string;
  id?: string;
  className?: string;
}

export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  label,
  id,
  className = '',
}: NumberFieldProps) {
  const [local, setLocal] = useState<string>(String(value));

  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      setLocal(String(value));
      return;
    }
    let v = parsed;
    if (min !== undefined) v = Math.max(min, v);
    if (max !== undefined) v = Math.min(max, v);
    onChange(v);
    setLocal(String(v));
  };

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative flex items-stretch">
        <button
          type="button"
          className="btn-ghost rounded-r-none px-3"
          onClick={() => commit(String(value - step))}
          aria-label="Decrease"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
          }}
          className="input text-center rounded-none border-x-0 flex-1 font-mono"
        />
        <button
          type="button"
          className="btn-ghost rounded-l-none px-3"
          onClick={() => commit(String(value + step))}
          aria-label="Increase"
        >
          +
        </button>
        {suffix && (
          <span className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
