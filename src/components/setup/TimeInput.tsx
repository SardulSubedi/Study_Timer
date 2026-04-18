interface TimeInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  helper?: string;
  id?: string;
}

export function TimeInput({ label, value, onChange, helper, id }: TimeInputProps) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input font-mono text-lg"
        step={60}
      />
      {helper && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
      )}
    </div>
  );
}
