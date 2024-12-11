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
    let startingColors = initialColors || [];
    
    if (startingColors.length === 0) {
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
            startingColors = parsed;
          } else {
            Cookies.remove(PALETTE_COOKIE_NAME);
            console.warn('Invalid color data found in cookie, clearing...');
          }
        }
      } catch (error) {
        Cookies.remove(PALETTE_COOKIE_NAME);
        console.error('Failed to parse colors from cookie:', error);
      }
    }
    
    return startingColors;
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const [lockedColors, setLockedColors] = useState<boolean[]>(() => {
    try {
      const savedLocks = Cookies.get('locked_colors');
      if (savedLocks) {
        const parsed = JSON.parse(savedLocks);
        if (Array.isArray(parsed) && parsed.length === 5 && parsed.every(lock => typeof lock === 'boolean')) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Failed to parse locked colors from cookie:', error);
    }
    return new Array(5).fill(false);
  });

  const generateNewPalette = useCallback(() => {
    if (colors.length === 0) return;

    console.log('Generating new palette. Current locked colors:', lockedColors);

    const themes = [
      { name: "nature", baseHues: [120, 60, 30] },
      { name: "muted-vintage", baseHues: [0, 15, 300] },
      { name: "cool-blues", baseHues: [200, 210, 230] },
    ];

    const theme = themes[Math.floor(Math.random() * themes.length)];
    const baseHue = theme.baseHues[Math.floor(Math.random() * theme.baseHues.length)];
    console.log('Selected theme:', theme.name, 'with base hue:', baseHue);

    const generateColorForIndex = (index: number): string => {
      const sat = 0.4 + Math.random() * 0.4;
      const light = 0.1 + Math.random() * 0.8;
      
      let hue: number;
      if (index === 0) {
        hue = baseHue;
      } else if (index === colors.length - 1) {
        hue = (baseHue + Math.random() * 20 - 10 + 360) % 360;
      } else {
        hue = (baseHue + index * 30 + Math.random() * 20 - 10 + 360) % 360;
      }
      
      return chroma.hsl(hue, sat, light).hex();
    };

    setColors(prevColors => {
      const newColors = prevColors.map((currentColor, index) => {
        // If color is locked, keep the current color
        if (lockedColors[index]) {
          console.log(`Color ${index} is locked. Keeping color:`, currentColor);
          return currentColor;
        }

        let newColor;
        let attempts = 0;
        const lockedColorSet = new Set(prevColors.filter((_, i) => lockedColors[i]));

        do {
          newColor = generateColorForIndex(index);
          attempts++;
          if (attempts === 1) {
            console.log(`Generating new color for position ${index}. Current color:`, currentColor);
          }
        } while (
          attempts < 10 && 
          (lockedColorSet.has(newColor) || 
           newColor.toLowerCase() === '#ffffff' || 
           newColor.toLowerCase() === '#000000')
        );

        console.log(`Position ${index}: Generated new color:`, newColor);
        return newColor;
      });

      return newColors;
    });
  }, [colors.length, lockedColors]); // Removed colors from dependencies to prevent unnecessary rerenders

  useEffect(() => {
    if (colors.length === 0 && !initialColors?.length && process.env.NODE_ENV !== 'test') {
      generateNewPalette();
    }
  }, [colors.length, generateNewPalette, initialColors]);

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

  useEffect(() => {
    if (colors.length > 0 && colors.length !== lockedColors.length) {
      setLockedColors(new Array(colors.length).fill(false));
    }
  }, [colors.length, lockedColors.length]);

  const toggleLock = useCallback((index: number) => {
    console.log('toggleLock called with index:', index);
    if (index < 0 || index >= colors.length) return;
    
    setLockedColors(prev => {
      const next = [...prev];
      next[index] = !next[index];
      console.log('New locked colors state:', next);
      
      // Save to cookie
      try {
        Cookies.set('locked_colors', JSON.stringify(next), { expires: COOKIE_EXPIRY });
      } catch (error) {
        console.error('Failed to save locked colors to cookie:', error);
      }
      
      return next;
    });
  }, [colors.length]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return {
    colors,
    setColors,
    darkMode,
    generateNewPalette,
    toggleDarkMode,
    handleColorChange,
    lockedColors,
    toggleLock,
  };
}
