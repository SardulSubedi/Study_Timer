import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/store/useSession';
import { useWakeLock } from '@/hooks/useWakeLock';
import { currentSection as findCurrent, actualPagesSoFar } from '@/lib/pace';
import { formatClock, formatCountdown } from '@/lib/time';
import { CurrentSectionHero } from './CurrentSectionHero';
import { SectionTimeline } from './SectionTimeline';
import { CompletionFooter } from './CompletionFooter';
import { ModeStatusBadge } from './ModeStatusBadge';
import { ProgressPopup } from './ProgressPopup';
import { PrefsMenu } from './PrefsMenu';

interface Props {
  now: number;
}

export function ActiveScreen({ now }: Props) {
  const session = useSession((s) => s.session);
  const prefs = useSession((s) => s.prefs);
  const logProgress = useSession((s) => s.logProgress);
  const advanceSections = useSession((s) => s.advanceSections);
  const completeSession = useSession((s) => s.completeSession);
  const markPopupShown = useSession((s) => s.markPopupShown);

  useWakeLock(!!session);

  const [popupForIdx, setPopupForIdx] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Session-wide derived values
  const current = session ? findCurrent(session, now) : undefined;
  const sessionOver = session ? now >= session.endMs : false;

  // Keep section statuses in sync with wall clock
  useEffect(() => {
    if (!session) return;
    advanceSections(now);
  }, [session, now, advanceSections]);

  // Trigger section-end popup + chime when a section closes
  const lastSeenCurrentRef = useRef<number>(-1);
  useEffect(() => {
    if (!session) return;
    const curIdx = current?.index ?? -1;
    if (
      lastSeenCurrentRef.current >= 0 &&
      curIdx !== lastSeenCurrentRef.current &&
      curIdx !== -1
    ) {
      const justClosedIdx = lastSeenCurrentRef.current;
      const justClosed = session.sections[justClosedIdx];
      // Don't pop for already-shown sections or breaks, or when in flow state
      const alreadyShown = session.popupShownFor.includes(justClosedIdx);
      const suppressFlow = session.mode === 'adaptive' && session.flowState === 'flow';
      if (justClosed && justClosed.type === 'work' && !alreadyShown && !suppressFlow) {
        setPopupForIdx(justClosedIdx);
        markPopupShown(justClosedIdx);
      }
      if (prefs.chime) playChime();
      if (prefs.notifications && document.visibilityState === 'hidden') {
        sendNotification(justClosed?.type === 'work' ? 'Section complete' : 'Break over');
      }
    }
    lastSeenCurrentRef.current = curIdx;
  }, [current?.index, session, prefs.chime, prefs.notifications, markPopupShown]);

  // Handle session completion
  useEffect(() => {
    if (session && sessionOver && !session.completedAt) {
      completeSession(now);
    }
  }, [session, sessionOver, now, completeSession]);

  // Tab title
  useEffect(() => {
    if (!session || !current) {
      document.title = 'StudyPace';
      return;
    }
    const remaining = formatCountdown(current.endMs - now);
    document.title = `${remaining} · S${current.index + 1} — StudyPace`;
    return () => {
      document.title = 'StudyPace';
    };
  }, [session, current, now]);

  // Keyboard shortcuts: + adds 1 page, Shift + adds 5
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable))
        return;
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        const inc = e.shiftKey ? 5 : 1;
        const cum = actualPagesSoFar(session) + inc;
        logProgress(cum, now);
        showToast(`+${inc} → ${cum} pages`);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const dec = e.shiftKey ? 5 : 1;
        const cum = Math.max(0, actualPagesSoFar(session) - dec);
        logProgress(cum, now);
        showToast(`−${dec} → ${cum} pages`);
      } else if (e.key.toLowerCase() === 'l') {
        setManualOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, now]);

  const showToast = (msg: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = window.setTimeout(() => setToast(null), 1600);
  };

  if (!session) return null;

  const handleSave = (pagesCum: number) => {
    logProgress(pagesCum, now);
    setPopupForIdx(null);
    setManualOpen(false);
  };

  const handleSkip = () => {
    setPopupForIdx(null);
    setManualOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border dark:border-border-dark">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">
              S
            </div>
            <div className="min-w-0">
              <div className="font-semibold truncate text-sm">
                {session.subject || 'Study session'}
              </div>
              <div className="text-[0.65rem] text-slate-500 dark:text-slate-400">
                {formatClock(session.startMs)} → {formatClock(session.endMs)}
              </div>
            </div>
          </div>
          <div className="flex-1" />
          <ModeStatusBadge session={session} current={current} />
          <div className="text-right font-mono">
            <div className="text-[0.65rem] text-slate-500 dark:text-slate-400">
              total left
            </div>
            <div className="text-sm">
              {formatCountdown(session.endMs - now)}
            </div>
          </div>
          <ThemeToggle />
          <PrefsMenu />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto max-w-5xl w-full px-4 py-6 sm:py-10 space-y-8">
        {current && (
          <section className="card p-6 sm:p-10">
            <CurrentSectionHero
              session={session}
              current={current}
              now={now}
              onLogClick={() => setManualOpen(true)}
            />
          </section>
        )}

        <SectionTimeline session={session} now={now} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border dark:border-border-dark">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="text-[0.7rem] text-slate-500 dark:text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">+</kbd> to log a page ·{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">L</kbd> to open log
          </div>
          <CompletionFooter session={session} now={now} />
        </div>
      </footer>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 card px-4 py-2 text-sm font-mono shadow-glow animate-slideUp"
        >
          {toast}
        </div>
      )}

      {/* Progress popups */}
      <ProgressPopup
        session={session}
        openForSectionIndex={popupForIdx}
        onSave={handleSave}
        onSkip={handleSkip}
      />
      <ProgressPopup
        session={session}
        openForSectionIndex={manualOpen ? current?.index ?? 0 : null}
        manualMode
        onSave={handleSave}
        onSkip={handleSkip}
      />
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() =>
    document.documentElement.classList.contains('dark'),
  );
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('studytimer:theme', next ? 'dark' : 'light');
    setDark(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-ghost !p-2 text-slate-400 hover:text-slate-100"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? '☾' : '☀'}
    </button>
  );
}

let audioCtx: AudioContext | undefined;
function playChime() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = 660;
    gain.gain.value = 0.001;
    osc.connect(gain).connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.65);
  } catch {
    // no-op
  }
}

function sendNotification(title: string) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      new Notification(title, { icon: '/favicon.svg' });
    }
  } catch {
    // no-op
  }
}
