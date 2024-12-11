
import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";
import Cookies from 'js-cookie';

const PALETTE_COOKIE_NAME = 'palette_colors';
const COOKIE_EXPIRY = 7; // Days

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen = false, initialColors }: UseColorPaletteProps = {}) {
  const [colors, setColors] = useState<string[]>(() => {
    try {
      const savedColors = Cookies.get(PALETTE_COOKIE_NAME);
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (Array.isArray(parsed) && 
            parsed.length <= 5 && 
            parsed.every(color => 
              typeof color === 'string' && 
              /^#[0-9A-Fa-f]{6}$/.test(color)
            )
        ) {
          return parsed;
        } else {
          Cookies.remove(PALETTE_COOKIE_NAME);
          console.warn('Invalid color data found in cookie, clearing...');
        }
      }
    } catch (error) {
      Cookies.remove(PALETTE_COOKIE_NAME);
      console.error('Failed to parse colors from cookie:', error);
    }
    return initialColors || [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
    const baseHue = Math.random() * 360;
    const newColors = Array.from({ length: 5 }, (_, i) => {
      const hue = (baseHue + (i * 360 / 5)) % 360;
      return chroma.hsl(hue, 0.7, 0.5).hex();
    });
    setColors(newColors);
  }, []);

  useEffect(() => {
    if (colors.length === 0 && !initialColors?.length && process.env.NODE_ENV !== 'test') {
      generateNewPalette();
    }
  }, [colors.length, initialColors, generateNewPalette]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = newColor;
      return next;
    });
  }, []);

  useEffect(() => {
    if (colors.length > 0 && colors.length <= 5) {
      if (colors.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
        try {
          Cookies.set(PALETTE_COOKIE_NAME, JSON.stringify(colors), { expires: COOKIE_EXPIRY });
        } catch (error) {
          console.error('Failed to save colors to cookie:', error);
          Cookies.remove(PALETTE_COOKIE_NAME);
        }
      } else {
        console.warn('Invalid color values detected, not saving to cookie');
      }
    }
  }, [colors]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return {
    colors,
    setColors,
    darkMode,
    generateNewPalette,
    toggleDarkMode,
    handleColorChange,
  };
}
