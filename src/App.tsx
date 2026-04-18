import { useEffect } from 'react';
import { useWallClock } from '@/hooks/useWallClock';
import { useSession } from '@/store/useSession';
import { SetupScreen } from '@/components/setup/SetupScreen';
import { ActiveScreen } from '@/components/active/ActiveScreen';
import { ResumeDialog } from '@/components/dialogs/ResumeDialog';
import { SessionCompleteDialog } from '@/components/dialogs/SessionCompleteDialog';

export default function App() {
  const now = useWallClock(250);
  const ui = useSession((s) => s.ui);
  const pendingResume = useSession((s) => s.pendingResume);
  const prefs = useSession((s) => s.prefs);

  // Request notification permission once, lazily, if the user enables them.
  useEffect(() => {
    if (!prefs.notifications) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => undefined);
    }
  }, [prefs.notifications]);

  return (
    <div className="min-h-screen bg-canvas dark:bg-canvas-dark text-slate-900 dark:text-slate-100">
      {ui === 'setup' && !pendingResume && <SetupScreen now={now} />}
      {ui === 'active' && <ActiveScreen now={now} />}
      {pendingResume && <ResumeDialog now={now} />}
      <SessionCompleteDialog />
    </div>
  );
}
