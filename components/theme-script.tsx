import { THEME_STORAGE_KEY } from '@/lib/theme'

/**
 * Inline hydration guard that resolves the persisted theme before React renders.
 * This avoids a flash of incorrect colors (FOUC) when the stored preference
 * differs from the system setting.
 */
const ThemeScript = () => {
  const script = `(() => {
    const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
    const darkQuery = '(prefers-color-scheme: dark)';
    const getSystemTheme = () => {
      try {
        return window.matchMedia && window.matchMedia(darkQuery).matches ? 'dark' : 'light';
      } catch (error) {
        return 'light';
      }
    };

    const applyTheme = theme => {
      const root = document.documentElement;
      if (!root) return;

      const oppositeTheme = theme === 'dark' ? 'light' : 'dark';
      root.classList.remove(oppositeTheme);
      root.classList.add(theme);
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    };

    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      if (storedTheme === 'light' || storedTheme === 'dark') {
        applyTheme(storedTheme);
        return;
      }
    } catch (error) {
      // Ignore and fallback to system preference
    }

    applyTheme(getSystemTheme());
  })();`

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}

export default ThemeScript
