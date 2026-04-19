export type Mode = 'even' | 'pomodoro' | 'adaptive';
export type SectionType = 'work' | 'short-break' | 'long-break';
export type SectionStatus = 'upcoming' | 'current' | 'done';
export type FlowState = 'normal' | 'flow' | 'recovery';
export type Sensitivity = 'low' | 'medium' | 'high';

export interface Section {
  index: number;
  type: SectionType;
  startMs: number;
  endMs: number;
  targetPagesDelta: number;
  targetPagesCumulative: number;
  actualPagesCumulative?: number;
  reportedAt?: number;
  status: SectionStatus;
  /** For Adaptive: remembers original length before a rebalance-driven change. */
  adjustedFromMs?: number;
  /** For Adaptive: short human-readable reason for the most recent adjustment. */
  adjustmentReason?: string;
}

export interface EvenSettings {
  /** Minimum section length in ms. */
  minLen: number;
  /** Maximum section length in ms. */
  maxLen: number;
  /**
   * Fraction of your page goal withheld from per-section targets (0–1).
   * At 0, every page you entered is assigned across sections.
   * Above 0, that share is left unassigned so visible targets sum to less than your total.
   */
  bufferPct: number;
  /** Strength of front-loading (0 = flat, 0.3 = last section ~70% of first). */
  frontLoad: number;
}

export interface PomodoroSettings {
  workMs: number;
  shortBreakMs: number;
  longBreakMs: number;
  sessionsBeforeLong: number;
  /** Front-load work blocks' page distribution. */
  frontLoad: number;
  bufferPct: number;
}

export interface AdaptiveSettings extends EvenSettings {
  sensitivity: Sensitivity;
  allowFlowExtension: boolean;
  allowRecoveryMode: boolean;
}

export type ModeSettings =
  | { mode: 'even'; even: EvenSettings }
  | { mode: 'pomodoro'; pomodoro: PomodoroSettings }
  | { mode: 'adaptive'; adaptive: AdaptiveSettings };

export interface ProgressEntry {
  sectionIndex: number;
  pagesCumulative: number;
  reportedAt: number;
}

export interface Session {
  id: string;
  createdAt: number;
  subject?: string;
  startMs: number;
  endMs: number;
  totalPages: number;
  mode: Mode;
  modeSettings: ModeSettings;
  sections: Section[];
  progressLog: ProgressEntry[];
  flowState: FlowState;
  /** Exponentially smoothed pace, pages per ms. */
  smoothedPace?: number;
  completedAt?: number;
  /** Sections whose popup has already been shown (prevents re-showing on refresh). */
  popupShownFor: number[];
}

export interface AppPrefs {
  chime: boolean;
  notifications: boolean;
  theme: 'light' | 'dark';
}

export const DEFAULT_EVEN: EvenSettings = {
  minLen: 15 * 60_000,
  maxLen: 45 * 60_000,
  bufferPct: 0,
  frontLoad: 0.2,
};

export const DEFAULT_POMODORO: PomodoroSettings = {
  workMs: 25 * 60_000,
  shortBreakMs: 5 * 60_000,
  longBreakMs: 20 * 60_000,
  sessionsBeforeLong: 4,
  frontLoad: 0.2,
  bufferPct: 0,
};

export const DEFAULT_ADAPTIVE: AdaptiveSettings = {
  ...DEFAULT_EVEN,
  sensitivity: 'medium',
  allowFlowExtension: true,
  allowRecoveryMode: true,
};

export const DEFAULT_PREFS: AppPrefs = {
  chime: false,
  notifications: false,
  theme: 'light',
};
