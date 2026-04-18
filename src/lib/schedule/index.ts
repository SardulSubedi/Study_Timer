import type { Mode, ModeSettings, Section } from '@/types';
import { planEven } from './even';
import { planPomodoro } from './pomodoro';
import { planAdaptive } from './adaptive';

export { planEven } from './even';
export { planPomodoro } from './pomodoro';
export { planAdaptive, rebalance } from './adaptive';

export interface PlanInput {
  mode: Mode;
  startMs: number;
  endMs: number;
  pages: number;
  settings: ModeSettings;
}

export function planForMode(input: PlanInput): Section[] {
  switch (input.settings.mode) {
    case 'even':
      return planEven({
        startMs: input.startMs,
        endMs: input.endMs,
        pages: input.pages,
        settings: input.settings.even,
      });
    case 'pomodoro':
      return planPomodoro({
        startMs: input.startMs,
        endMs: input.endMs,
        pages: input.pages,
        settings: input.settings.pomodoro,
      });
    case 'adaptive':
      return planAdaptive({
        startMs: input.startMs,
        endMs: input.endMs,
        pages: input.pages,
        settings: input.settings.adaptive,
      });
  }
}
