import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContext';
import { readStorage, STORAGE_KEYS, writeStorage } from '../../utils/storage';

function resolveInitialTheme() {
  if (typeof document !== 'undefined') {
    const preset = document.documentElement.dataset.theme;
    if (preset === 'light' || preset === 'dark') return preset;
  }
  const stored = readStorage(STORAGE_KEYS.theme, null);
  if (stored === 'light' || stored === 'dark') return stored;
  if (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: light)').matches
  ) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    writeStorage(STORAGE_KEYS.theme, theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0a192f' : '#f8fafc');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
