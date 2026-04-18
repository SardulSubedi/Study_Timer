import { Dialog } from '../ui/Dialog';
import { useSession } from '@/store/useSession';
import { actualPagesSoFar } from '@/lib/pace';
import { formatDuration } from '@/lib/time';

export function SessionCompleteDialog() {
  const session = useSession((s) => s.session);
  const ui = useSession((s) => s.ui);
  const clear = useSession((s) => s.clearSession);

  if (!session || ui !== 'complete') return null;

  const totalMs = session.endMs - session.startMs;
  const pagesCovered = actualPagesSoFar(session);
  const pct = session.totalPages === 0 ? 0 : Math.round((pagesCovered / session.totalPages) * 100);

  // Best and worst work section by pace.
  let best: { idx: number; pace: number } | undefined;
  let worst: { idx: number; pace: number } | undefined;
  for (let i = 0; i < session.sections.length; i++) {
    const s = session.sections[i];
    if (s.type !== 'work') continue;
    if (s.actualPagesCumulative === undefined) continue;
    const prev = i === 0 ? 0 : session.sections[i - 1].actualPagesCumulative ?? 0;
    const delta = s.actualPagesCumulative - prev;
    const dur = Math.max(1, s.endMs - s.startMs);
    const pace = delta / dur; // pages per ms
    if (!best || pace > best.pace) best = { idx: i, pace };
    if (!worst || pace < worst.pace) worst = { idx: i, pace };
  }

  return (
    <Dialog open={true} dismissable={false} title="Session complete">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Pages covered" value={`${pagesCovered} / ${session.totalPages}`} />
          <Stat label="Completion" value={`${pct}%`} />
          <Stat label="Time allotted" value={formatDuration(totalMs)} />
          <Stat
            label="Sections"
            value={`${session.sections.filter((s) => s.type === 'work').length} work`}
          />
        </div>
        {best && worst && best.idx !== worst.idx && (
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              Best section: <span className="font-mono">#{best.idx + 1}</span>
            </p>
            <p>
              Slowest section: <span className="font-mono">#{worst.idx + 1}</span>
            </p>
          </div>
        )}
        <button type="button" onClick={clear} className="btn-primary w-full">
          New session
        </button>
      </div>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="subtle-card p-3">
      <div className="small-caps">{label}</div>
      <div className="font-mono text-lg mt-1">{value}</div>
    </div>
  );
}
