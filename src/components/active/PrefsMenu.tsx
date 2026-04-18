import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from '@/store/useSession';

export function PrefsMenu() {
  const prefs = useSession((s) => s.prefs);
  const setPrefs = useSession((s) => s.setPrefs);
  const clear = useSession((s) => s.clearSession);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleEndSession = () => {
    if (window.confirm('End this session and discard progress?')) {
      clear();
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost !p-2 text-slate-400 hover:text-slate-100"
        aria-label="Preferences"
        title="Preferences"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
          <path
            fill="currentColor"
            d="M12 8a4 4 0 100 8 4 4 0 000-8zm8.94 3a1 1 0 01-.5.87l-1.9 1.1a7.97 7.97 0 010 1.06l1.9 1.1a1 1 0 01.37 1.37l-2 3.46a1 1 0 01-1.37.37l-1.9-1.1a8 8 0 01-.92.53l-.3 2.17A1 1 0 0113 22h-4a1 1 0 01-1-.87l-.3-2.17a8 8 0 01-.92-.53l-1.9 1.1a1 1 0 01-1.37-.37l-2-3.46a1 1 0 01.37-1.37l1.9-1.1a7.97 7.97 0 010-1.06l-1.9-1.1A1 1 0 012.06 11l2-3.46a1 1 0 011.37-.37l1.9 1.1c.3-.2.6-.38.92-.53L8.56 5a1 1 0 011.01-.87H12a1 1 0 011 .87l.3 2.17c.32.15.62.33.92.53l1.9-1.1a1 1 0 011.37.37l2 3.46c.06.16.1.32.1.5z"
          />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 mt-2 w-64 card p-3 z-30"
          >
            <div className="space-y-2 text-sm">
              <Row
                label="Chime on section change"
                checked={prefs.chime}
                onChange={(v) => setPrefs({ chime: v })}
              />
              <Row
                label="System notifications"
                checked={prefs.notifications}
                onChange={(v) => setPrefs({ notifications: v })}
              />
            </div>
            <div className="h-px bg-border dark:bg-border-dark my-3" />
            <button
              type="button"
              onClick={handleEndSession}
              className="btn-danger w-full text-xs"
            >
              End session & return
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer rounded-md px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/5">
      <span className="text-slate-700 dark:text-slate-200">{label}</span>
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
