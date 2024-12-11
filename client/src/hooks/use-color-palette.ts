
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

  const [lockedColors, setLockedColors] = useState<boolean[]>(new Array(5).fill(false));
  const [darkMode, setDarkMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  const generateNewPalette = useCallback(() => {
    const themes = [
      { name: "nature", baseHues: [120, 60, 30] }, // Greens, yellows, browns
      { name: "muted-vintage", baseHues: [0, 15, 300] }, // Reds, purples
      { name: "cool-blues", baseHues: [200, 210, 230] }, // Blues
    ];

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const baseHue = theme.baseHues[Math.floor(Math.random() * theme.baseHues.length)];
    const baseColor = chroma.hsl(baseHue, 0.6, 0.5);

    const randomLightness = () => 0.05 + Math.random() * 0.9;
    const randomSaturation = () => Math.random() * 0.4 + 0.4;

    setColors(prevColors => {
      const newColors = [...prevColors];
      const colorSet = new Set();

      for (let i = 0; i < 5; i++) {
        if (!lockedColors[i]) {
          let newColor;
          let attempts = 0;

          do {
            if (i === 0 && !lockedColors[i]) {
              newColor = baseColor.hex();
            } else if (i === 4 && !lockedColors[i]) {
              const neutralHue = baseHue + Math.random() * 20 - 10;
              newColor = chroma.hsl(
                (neutralHue + 360) % 360,
                randomSaturation() * 0.6,
                randomLightness() * 0.7 + 0.1
              ).hex();
            } else if (!lockedColors[i]) {
              newColor = chroma.hsl(
                (baseHue + i * 30 + Math.random() * 20 - 10) % 360,
                randomSaturation(),
                randomLightness()
              ).hex();
            }
            attempts++;
          } while (
            (!lockedColors[i] && colorSet.has(newColor) || newColor?.toLowerCase() === '#ffffff' || newColor?.toLowerCase() === '#000000') &&
            attempts < 10
          );

          if (!lockedColors[i]) {
            colorSet.add(newColor);
            newColors[i] = newColor;
          }
        }
      }

      return newColors;
    });
  }, [lockedColors]);

  const toggleLock = useCallback((index: number) => {
    setLockedColors(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
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
    lockedColors,
    toggleLock,
    darkMode,
    generateNewPalette,
    toggleDarkMode,
    handleColorChange,
  };
}
