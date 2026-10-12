import { useState, useEffect, useCallback } from 'react';
import type { UserPreferences } from '@/types/api';
import { loadPreferences, savePreferences } from '@/lib/utils';

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(loadPreferences);

  useEffect(() => {
    // Apply theme
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else if (preferences.theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [preferences.theme]);

  const setPreferences = useCallback((update: Partial<UserPreferences>) => {
    setPreferencesState((prev: UserPreferences) => {
      const next = { ...prev, ...update };
      savePreferences(next);
      return next;
    });
  }, []);

  return { preferences, setPreferences };
}
