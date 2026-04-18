import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppPrefs,
  Mode,
  ModeSettings,
  ProgressEntry,
  Section,
  Session,
} from '@/types';
import {
  DEFAULT_ADAPTIVE,
  DEFAULT_EVEN,
  DEFAULT_POMODORO,
  DEFAULT_PREFS,
} from '@/types';
import { planForMode, rebalance } from '@/lib/schedule';

type UIMode = 'setup' | 'active' | 'complete';

interface SessionState {
  session: Session | null;
  prefs: AppPrefs;
  ui: UIMode;
  /** When a session is loaded from persistence, hold it here until user confirms resume. */
  pendingResume: Session | null;

  // Draft state for the setup screen (persisted so form survives refresh)
  draft: {
    subject: string;
    startNow: boolean;
    startValue: string; // "HH:MM"
    endValue: string; // "HH:MM"
    pages: number;
    mode: Mode;
    settings: ModeSettings;
  };

  setDraft: (patch: Partial<SessionState['draft']>) => void;
  setDraftMode: (mode: Mode) => void;
  updateModeSettings: (patch: Partial<ModeSettings>) => void;

  beginSession: (input: {
    subject?: string;
    startMs: number;
    endMs: number;
    pages: number;
    mode: Mode;
    settings: ModeSettings;
  }) => void;

  logProgress: (pagesCumulative: number, nowMs: number) => void;
  /** Called when section boundaries are crossed; updates statuses and (for adaptive) rebalances. */
  advanceSections: (nowMs: number) => void;
  markPopupShown: (sectionIndex: number) => void;
  completeSession: (nowMs: number) => void;
  clearSession: () => void;

  acceptResume: () => void;
  declineResume: () => void;

  setPrefs: (patch: Partial<AppPrefs>) => void;
  setUI: (ui: UIMode) => void;
}

const initialDraft: SessionState['draft'] = {
  subject: '',
  startNow: true,
  startValue: '',
  endValue: '',
  pages: 100,
  mode: 'even',
  settings: { mode: 'even', even: { ...DEFAULT_EVEN } },
};

function genId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

function applyStatuses(sections: Section[], nowMs: number): Section[] {
  return sections.map((s) => {
    if (nowMs >= s.endMs) return { ...s, status: 'done' as const };
    if (nowMs >= s.startMs) return { ...s, status: 'current' as const };
    return { ...s, status: 'upcoming' as const };
  });
}

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      prefs: { ...DEFAULT_PREFS },
      ui: 'setup',
      pendingResume: null,
      draft: initialDraft,

      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

      setDraftMode: (mode) =>
        set((s) => {
          let settings: ModeSettings;
          if (mode === 'even') {
            settings = {
              mode: 'even',
              even:
                s.draft.settings.mode === 'even'
                  ? s.draft.settings.even
                  : { ...DEFAULT_EVEN },
            };
          } else if (mode === 'pomodoro') {
            settings = {
              mode: 'pomodoro',
              pomodoro:
                s.draft.settings.mode === 'pomodoro'
                  ? s.draft.settings.pomodoro
                  : { ...DEFAULT_POMODORO },
            };
          } else {
            settings = {
              mode: 'adaptive',
              adaptive:
                s.draft.settings.mode === 'adaptive'
                  ? s.draft.settings.adaptive
                  : { ...DEFAULT_ADAPTIVE },
            };
          }
          return { draft: { ...s.draft, mode, settings } };
        }),

      updateModeSettings: (patch) =>
        set((s) => {
          const current = s.draft.settings;
          let next: ModeSettings;
          if (current.mode === 'even' && 'even' in patch) {
            next = {
              mode: 'even',
              even: { ...current.even, ...(patch as { even: Partial<typeof current.even> }).even },
            };
          } else if (
            current.mode === 'pomodoro' &&
            'pomodoro' in patch
          ) {
            next = {
              mode: 'pomodoro',
              pomodoro: {
                ...current.pomodoro,
                ...(patch as { pomodoro: Partial<typeof current.pomodoro> }).pomodoro,
              },
            };
          } else if (
            current.mode === 'adaptive' &&
            'adaptive' in patch
          ) {
            next = {
              mode: 'adaptive',
              adaptive: {
                ...current.adaptive,
                ...(patch as { adaptive: Partial<typeof current.adaptive> }).adaptive,
              },
            };
          } else {
            next = current;
          }
          return { draft: { ...s.draft, settings: next } };
        }),

      beginSession: ({ subject, startMs, endMs, pages, mode, settings }) => {
        const sections = planForMode({ mode, startMs, endMs, pages, settings });
        const session: Session = {
          id: genId(),
          createdAt: Date.now(),
          subject: subject?.trim() || undefined,
          startMs,
          endMs,
          totalPages: pages,
          mode,
          modeSettings: settings,
          sections,
          progressLog: [],
          flowState: 'normal',
          popupShownFor: [],
        };
        set({ session, ui: 'active', pendingResume: null });
      },

      logProgress: (pagesCumulative, nowMs) => {
        const session = get().session;
        if (!session) return;
        const entry: ProgressEntry = {
          sectionIndex: session.sections.findIndex(
            (s) => nowMs >= s.startMs && nowMs < s.endMs,
          ),
          pagesCumulative: Math.max(0, Math.round(pagesCumulative)),
          reportedAt: nowMs,
        };
        // Associate with the most recently completed section if we're between sections
        const lastDoneIdx = session.sections.reduce(
          (acc, s) => (nowMs >= s.endMs ? s.index : acc),
          -1,
        );
        const attachedIdx =
          entry.sectionIndex === -1 ? lastDoneIdx : entry.sectionIndex;

        const updatedSections = session.sections.map((s) => {
          if (s.index === attachedIdx && nowMs >= s.startMs) {
            return { ...s, actualPagesCumulative: entry.pagesCumulative, reportedAt: nowMs };
          }
          return s;
        });

        let nextSession: Session = {
          ...session,
          sections: updatedSections,
          progressLog: [...session.progressLog, entry],
        };

        // For adaptive mode: if a section's just closed and we now have its actual,
        // trigger a rebalance for upcoming sections.
        if (session.mode === 'adaptive' && attachedIdx >= 0) {
          const attached = updatedSections[attachedIdx];
          if (attached && nowMs >= attached.endMs) {
            const result = rebalance(nextSession, attachedIdx, nowMs);
            if (result) {
              nextSession = {
                ...nextSession,
                sections: result.sections,
                smoothedPace: result.smoothedPace,
                flowState: result.flowState,
              };
            }
          }
        }

        set({ session: nextSession });
      },

      advanceSections: (nowMs) => {
        const session = get().session;
        if (!session) return;
        const updated = applyStatuses(session.sections, nowMs);
        const changed = updated.some((s, i) => s.status !== session.sections[i].status);
        if (!changed) return;
        set({ session: { ...session, sections: updated } });
      },

      markPopupShown: (sectionIndex) => {
        const session = get().session;
        if (!session) return;
        if (session.popupShownFor.includes(sectionIndex)) return;
        set({
          session: {
            ...session,
            popupShownFor: [...session.popupShownFor, sectionIndex],
          },
        });
      },

      completeSession: (nowMs) => {
        const session = get().session;
        if (!session) return;
        set({
          session: { ...session, completedAt: nowMs },
          ui: 'complete',
        });
      },

      clearSession: () => {
        set({ session: null, ui: 'setup', pendingResume: null });
      },

      acceptResume: () => {
        const p = get().pendingResume;
        if (!p) return;
        const now = Date.now();
        const ui: UIMode = now >= p.endMs ? 'complete' : 'active';
        set({ session: p, pendingResume: null, ui });
      },

      declineResume: () => {
        set({ pendingResume: null, session: null, ui: 'setup' });
      },

      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      setUI: (ui) => set({ ui }),
    }),
    {
      name: 'studytimer:v1',
      version: 1,
      partialize: (s) => ({
        session: s.session,
        prefs: s.prefs,
        draft: s.draft,
      }),
      onRehydrateStorage: () => (state) => {
        // On load: if we have a session, gate it behind the resume dialog.
        if (state?.session && !state.session.completedAt) {
          state.pendingResume = state.session;
          state.session = null;
          state.ui = 'setup';
        }
      },
    },
  ),
);
