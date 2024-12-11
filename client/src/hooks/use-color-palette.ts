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
    const baseColor: Color = chroma.random()
      .set('hsl.s', 0.4 + Math.random() * 0.4) // Random saturation (0.4–0.8)
      .set('hsl.l', 0.3 + Math.random() * 0.5); // Random lightness (0.3–0.8)

    const randomHueShift = () => Math.random() * 120 - 60; // Random shift in range [-60, 60]
    const randomLightnessAdjustment = () => Math.random() * 0.3 - 0.15; // Random adjustment [-0.15, 0.15]
    const randomSaturationAdjustment = () => Math.random() * 0.3 - 0.15; // Random adjustment [-0.15, 0.15]

    const newColors = [];
    const colorSet = new Set(); // Use a set to track unique colors

    for (let i = 0; i < 5; i++) {
      let newColor;
      let attempts = 0;

      do {
        if (i === 0) {
          // First color is the base color
          newColor = baseColor.hex();
        } else {
          // Generate a new color based on the base color with random adjustments
          newColor = chroma(baseColor)
            .set('hsl.h', (baseColor.get('hsl.h') + i * 30 + randomHueShift()) % 360)
            .set('hsl.l', Math.min(1, Math.max(0, baseColor.get('hsl.l') + randomLightnessAdjustment())))
            .set('hsl.s', Math.min(1, Math.max(0, baseColor.get('hsl.s') + randomSaturationAdjustment())))
            .hex();
        }

        // Ensure the color is not pure white or black
        attempts++;
      } while (
        (colorSet.has(newColor) || newColor.toLowerCase() === '#ffffff' || newColor.toLowerCase() === '#000000') &&
        attempts < 10
      );

      colorSet.add(newColor);
      newColors.push(newColor);
    }

    // Adjust for visual balance, contrast, and uniqueness
    const adjustedColors: string[] = [];
    for (let i = 0; i < newColors.length; i++) {
      const prevColor = i > 0 ? chroma(adjustedColors[i - 1]) : null;
      let currentColor = chroma(newColors[i]);

      // Adjust for contrast with previous color
      if (prevColor) {
        const contrast = chroma.contrast(prevColor, currentColor);
        if (contrast < 2.5) {
          currentColor = currentColor.set('hsl.l', Math.min(1, currentColor.get('hsl.l') + 0.2));
        } else if (contrast > 4) {
          currentColor = currentColor.set('hsl.l', Math.max(0, currentColor.get('hsl.l') - 0.2));
        }
      }

      // Final validation: ensure no white/black and uniqueness
      let finalColor = currentColor.hex();
      let attempts = 0; // Declare `attempts` for the second while loop
      while (
        (adjustedColors.includes(finalColor) || finalColor.toLowerCase() === '#ffffff' || finalColor.toLowerCase() === '#000000') &&
        attempts < 10
      ) {
        finalColor = chroma(baseColor)
          .set('hsl.h', (baseColor.get('hsl.h') + randomHueShift()) % 360)
          .set('hsl.l', Math.random() * 0.8 + 0.2) // Ensure a valid range
          .set('hsl.s', Math.random() * 0.8 + 0.2) // Ensure a valid range
          .hex();
        attempts++;
      }

      adjustedColors.push(finalColor);
    }

    // Update the state, respecting locked colors
    setColors(prev => {
      if (prev.length === 0) return adjustedColors;
      return prev.map((color, index) => 
        lockedColors[index] ? color : adjustedColors[index]
      );
    });
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
    // and we're not in a test environment
    if (colors.length === 0 && !initialColors?.length && process.env.NODE_ENV !== 'test') {
      generateNewPalette();
    }
  }, [colors.length, initialColors, generateNewPalette]);

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
