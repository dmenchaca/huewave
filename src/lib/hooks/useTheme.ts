import { useEffect } from 'react';

export const useTheme = (isDark: boolean) => {
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
};