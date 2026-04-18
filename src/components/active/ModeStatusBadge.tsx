import type { Section, Session } from '@/types';

interface Props {
  session: Session;
  current?: Section;
}

export function ModeStatusBadge({ session, current }: Props) {
  if (session.mode === 'even') {
    return (
      <Badge color="slate" label="Even pacing" />
    );
  }
  if (session.mode === 'pomodoro') {
    if (!current) return <Badge color="slate" label="Pomodoro" />;
    if (current.type === 'work')
      return <Badge color="indigo" label="Focus" />;
    if (current.type === 'short-break')
      return <Badge color="sky" label="Short break" />;
    return <Badge color="sky" label="Long break" />;
  }
  // Adaptive
  if (session.flowState === 'flow')
    return <Badge color="emerald" label="In Flow" pulse />;
  if (session.flowState === 'recovery')
    return <Badge color="rose" label="Recovery" />;
  return <Badge color="amber" label="Adaptive" />;
}

type BadgeColor = 'slate' | 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose';

function Badge({
  color,
  label,
  pulse,
}: {
  color: BadgeColor;
  label: string;
  pulse?: boolean;
}) {
  const cls: Record<BadgeColor, string> = {
    slate:
      'bg-slate-500/10 text-slate-600 dark:text-slate-300 ring-1 ring-slate-500/20',
    indigo:
      'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-500/30',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/30',
    emerald:
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30',
    amber:
      'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls[color]} ${
        pulse ? 'animate-pulseSoft' : ''
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
