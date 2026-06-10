export type Theme = 'light' | 'dark';

const PERSIST_KEY = 'studytimer:v1';
const LEGACY_THEME_KEY = 'studytimer:theme';

export const THEME_COLOR: Record<Theme, string> = {
  light: '#F6F7FB',
  dark: '#0F1117',
};

export function readPersistedTheme(): Theme {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        state?: { prefs?: { theme?: string } };
      };
      const theme = parsed?.state?.prefs?.theme;
      if (theme === 'dark' || theme === 'light') return theme;
    }
  } catch {
    // ignore corrupt storage
  }

  const legacy = localStorage.getItem(LEGACY_THEME_KEY);
  if (legacy === 'dark' || legacy === 'light') return legacy;

  return 'light';
}

/** Remove legacy key after prefs.theme has absorbed the value. */
export function clearLegacyThemeKey(): void {
  try {
    localStorage.removeItem(LEGACY_THEME_KEY);
  } catch {
    // ignore
  }
}

export function applyThemeToDocument(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[theme]);
}
