import { useState, useEffect } from 'react';
import { getInitialTheme, setThemeClass } from '../utils/theme';

export const useTheme = () => {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    setThemeClass(isDark);
  }, [isDark]);

  return { isDark, setIsDark };
};