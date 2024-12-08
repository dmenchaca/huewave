import { useState, useCallback, useEffect } from "react";
import chroma, { Color } from "chroma-js";
import Cookies from 'js-cookie';

const PALETTE_COOKIE_NAME = 'palette_colors';
const LOCKED_COLORS_COOKIE_NAME = 'locked_colors';
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
        // Validate the parsed data is an array of valid hex colors
        if (Array.isArray(parsed) && 
            parsed.length <= 5 && 
            parsed.every(color => 
              typeof color === 'string' && 
              /^#[0-9A-Fa-f]{6}$/.test(color)
            )
        ) {
          return parsed;
        } else {
          // Clear invalid cookie
          Cookies.remove(PALETTE_COOKIE_NAME);
          console.warn('Invalid color data found in cookie, clearing...');
        }
      }
    } catch (error) {
      // Clear malformed cookie
      Cookies.remove(PALETTE_COOKIE_NAME);
      console.error('Failed to parse colors from cookie:', error);
    }
    return initialColors || [];
  });
  
  const [lockedColors, setLockedColors] = useState<boolean[]>(() => {
    try {
      const savedLocked = Cookies.get(LOCKED_COLORS_COOKIE_NAME);
      if (savedLocked) {
        const parsed = JSON.parse(savedLocked);
        // Validate the parsed data is an array of exactly 5 booleans
        if (Array.isArray(parsed) && 
            parsed.length === 5 && 
            parsed.every(lock => typeof lock === 'boolean')
        ) {
          return parsed;
        } else {
          // Clear invalid cookie
          Cookies.remove(LOCKED_COLORS_COOKIE_NAME);
          console.warn('Invalid locked colors data found in cookie, clearing...');
        }
      }
    } catch (error) {
      // Clear malformed cookie
      Cookies.remove(LOCKED_COLORS_COOKIE_NAME);
      console.error('Failed to parse locked colors from cookie:', error);
    }
    return [false, false, false, false, false];
  });
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
    // Generate a base color with controlled saturation and brightness
    const baseColor: Color = chroma.random()
      .set('hsl.s', 0.5 + Math.random() * 0.3) // Vibrant saturation
      .set('hsl.l', 0.4 + Math.random() * 0.2); // Controlled lightness

    // Generate harmonious colors using patterns observed
    const newColors = [
      baseColor.hex(), // Base color
      chroma(baseColor).set('hsl.h', baseColor.get('hsl.h') + 15).hex(), // Slightly shifted hue
      chroma(baseColor).set('hsl.h', baseColor.get('hsl.h') + 60).brighten(1).hex(), // Lighter analogous
      chroma(baseColor).set('hsl.h', (baseColor.get('hsl.h') + 180) % 360).darken(1).hex(), // Complementary darker
      chroma(baseColor).set('hsl.h', (baseColor.get('hsl.h') + 150) % 360).hex(), // Split complementary
    ];

    // Ensure minimum contrast between adjacent colors
    const adjustedColors = newColors.map((color, i) => {
      if (i === 0) return color; // Skip base color
      const prevColor = chroma(newColors[i - 1]);
      const currentColor = chroma(color);
      const contrast = chroma.contrast(prevColor, currentColor);

      // Adjust lightness to improve contrast if necessary
      if (contrast < 2) {
        return currentColor
          .set('hsl.l', Math.min(currentColor.get('hsl.l') + 0.2, 1))
          .hex();
      }
      return color;
    });

    // Update the state, respecting locked colors
    setColors(prev =>
      prev.length === 0
        ? adjustedColors
        : prev.map((color, index) =>
            lockedColors[index] ? color : adjustedColors[index]
          )
    );
  }, [lockedColors]);

  
  const toggleLock = useCallback((index: number) => {
    setLockedColors(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev: boolean) => {
      const next = !prev;
      localStorage.setItem("darkMode", JSON.stringify(next));
      return next;
    });
  }, []);

  // Save colors to cookies whenever they change
  useEffect(() => {
    if (colors.length > 0 && colors.length <= 5) {
      // Validate all colors are valid hex values
      if (colors.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
        try {
          Cookies.set(PALETTE_COOKIE_NAME, JSON.stringify(colors), { expires: COOKIE_EXPIRY });
        } catch (error) {
          console.error('Failed to save colors to cookie:', error);
          // Clear potentially corrupted cookie
          Cookies.remove(PALETTE_COOKIE_NAME);
        }
      } else {
        console.warn('Invalid color values detected, not saving to cookie');
      }
    }
  }, [colors]);

  // Save locked colors state to cookies whenever they change
  useEffect(() => {
    // Validate locked colors array
    if (Array.isArray(lockedColors) && 
        lockedColors.length === 5 && 
        lockedColors.every(lock => typeof lock === 'boolean')
    ) {
      try {
        Cookies.set(LOCKED_COLORS_COOKIE_NAME, JSON.stringify(lockedColors), { expires: COOKIE_EXPIRY });
      } catch (error) {
        console.error('Failed to save locked colors to cookie:', error);
        // Clear potentially corrupted cookie
        Cookies.remove(LOCKED_COLORS_COOKIE_NAME);
      }
    } else {
      console.warn('Invalid locked colors data detected, not saving to cookie');
    }
  }, [lockedColors]);

  // Initialize palette on mount if needed
  useEffect(() => {
    // Only generate new palette if no colors exist (neither in cookies nor initialColors)
    if (colors.length === 0 && !initialColors?.length) {
      generateNewPalette();
    }
  }, [generateNewPalette, initialColors]); // Include dependencies

  // Apply dark mode
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

  return {
    colors,
    setColors,
    lockedColors,
    darkMode,
    generateNewPalette,
    toggleLock,
    toggleDarkMode,
    handleColorChange,
  };
}
