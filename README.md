# StudyPace — Study Timer

An unstoppable, wall-clock-accurate study timer. Tell it what time you need to be done and how many pages/sections you need to cover, and it breaks the work down into pace-tracked chunks that adapt to what you actually do.

> **Why unstoppable?** Real-world time is passing whether you pause the app or not. StudyPace refuses to lie to you: the timer is derived from `Date.now()`, not a counter. Close the tab, refresh, get distracted — the clock keeps ticking, and the app resumes exactly where reality left off.

## Features

- **Three scheduling modes**
  - **Even Breakdown** — section length = `clamp(4% of total time, 15 min, 45 min)`, front-loaded page targets, hidden buffer.
  - **Pomodoro** — configurable work / short break / long break, long break every _N_ sessions. Pages distributed across work blocks only.
  - **Adaptive Flow** — rebalances remaining sections after each report using a smoothed pace (0.7 × previous + 0.3 × latest). Detects **flow** (3 strong sections in a row → longer blocks, popups suppressed) and **recovery** (2+ weak sections → shorter blocks, lowered targets).
- **Dual-fill progress bar** — the section's progress bar shows both time elapsed (solid indigo fill) and your current page position (thin tick, colored emerald/amber/rose). The gap between them is shaded so "are you ahead or behind?" is answerable without reading a single number.
- **Typographic target vs pace** — targets render in `JetBrains Mono`, pace in `Fraunces` italic serif, using the same size so the contrast is meaningful at a glance. Appears everywhere the two numbers coexist (hero, timeline cards).
- **Live ETC vs Target finish** — bottom-right corner always shows your hard deadline and your projected finish based on observed pace, with the delta ("17 min behind target") called out.
- **Optional, non-disruptive progress popups** — toast-style card at section boundaries asks "how many pages are you on?" Skip it and nothing breaks; the app reuses the last known pace.
- **Plan preview before you start** — every scheduling decision is rendered as a proportional timeline on the setup screen, so you know exactly what you're signing up for.
- **Keyboard-first logging** — <kbd>+</kbd>/<kbd>-</kbd> adjust by 1, <kbd>Shift</kbd>+<kbd>+</kbd>/<kbd>-</kbd> by 5, <kbd>L</kbd> opens the log dialog.
- **Resume on refresh** — sessions persist to `localStorage` and prompt you to resume or reset on reload.
- **Polish** — dark mode, Screen Wake Lock, system notifications when tab is hidden, `prefers-reduced-motion`, responsive, `aria-live` countdown, tab title updates live, optional chime on section change.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build

```bash
npm run build
npm run preview
```

### Deploy

The output in `dist/` is static. Drop it on Vercel, Netlify, Cloudflare Pages, or GitHub Pages. No backend is required.

## Architecture

```
src/
├── main.tsx
├── App.tsx                          # screen router (setup / active / complete)
├── types.ts                         # Session, Section, ModeSettings, defaults
├── lib/
│   ├── time.ts                      # clamp, formatCountdown, formatClock, time-input parsing
│   ├── pace.ts                      # targetPagesAt, observedPace, estimatedFinish, currentSection
│   └── schedule/
│       ├── even.ts                  # 4%-clamp + front-loaded weights + buffer
│       ├── pomodoro.ts              # work/break cycle, pages → work blocks only
│       ├── adaptive.ts              # rebalance(), flow/recovery detection
│       └── index.ts                 # mode dispatcher
├── store/useSession.ts              # Zustand store + persist + resume gating
├── hooks/
│   ├── useWallClock.ts              # tick every 250ms, immediate update on tab refocus
│   └── useWakeLock.ts               # best-effort screen wake lock
└── components/
    ├── setup/                       # SetupScreen, TimeInput, ModeTabs, ModeSettingsPanel, PlanPreview
    ├── active/                      # ActiveScreen, CurrentSectionHero, SectionTimeline, SectionCard,
    │                                # CompletionFooter, ModeStatusBadge, ProgressPopup, PrefsMenu
    ├── dialogs/                     # ResumeDialog, SessionCompleteDialog
    └── ui/                          # Dialog, NumberField, Slider
```

### Time is a projection, not a counter

Every rendered value (remaining, current section, progress bar fill, page target at this instant) is a pure function of `(Date.now(), session)`. There are no `setTimeout` chains. The only thing that "ticks" is the 250 ms interval that forces React to re-render; every state transition (section-end, session-end) is derived from whether `now` has crossed a boundary.

This means:
- Closing the tab cannot lose progress.
- Refreshing cannot desync the timer.
- The tab being backgrounded for 20 minutes correctly shows you've burned 20 minutes when you return.

### Adaptive rebalance

When a section closes (or the user logs progress at its boundary) in Adaptive mode:

1. Compute the latest section's pace = `pagesDone / sectionDurationMs`.
2. Smooth it with the running average: `smoothed = 0.7 × previous + 0.3 × latest` (falls back to `latest` on the first report).
3. Compute `ratio = latest / requiredPace` where `requiredPace = remainingPages / remainingMs`.
4. Based on sensitivity (low/medium/high) thresholds, nudge the next section length by ±5 min, clamped to min/max.
5. Evaluate flow (last 3 ratios ≥ 1.0 → extend further, suppress popups) and recovery (last 2 ratios < slow-threshold → minimum length).
6. Regenerate _only_ upcoming sections with the new length and page targets = smoothed pace × new length, re-normalized so cumulative targets still equal `totalPages`.

Sections that were shortened or extended surface a small `↕` badge with a tooltip explaining why ("Strong pace — extended section"). Transparent magic > mystery magic.

## License

MIT
