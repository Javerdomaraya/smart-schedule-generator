import { useState, useEffect, useLayoutEffect } from 'react';

/**
 * Custom hook to encapsulate theme state, localStorage syncing,
 * system theme event listener, and document level side-effects.
 */
export function useTheme() {
  // Read theme state from localStorage, fallback to system preferences
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('isDarkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    // Check user's OS color scheme preferences
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class list updates synchronously before the browser paints.
  // This completely eliminates any visual flicker on initial page load.
  useLayoutEffect(() => {
    localStorage.setItem('isDarkMode', isDarkMode.toString());
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Synchronize theme dynamically when user shifts OS-level color scheme
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    // Modern browsers support addEventListener for media query lists
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback for older browsers / testing environments
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme,
  };
}
