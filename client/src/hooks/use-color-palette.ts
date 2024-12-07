import { useState, useCallback, useEffect } from "react";
import chroma, { Color } from "chroma-js";

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen = false, initialColors }: UseColorPaletteProps = {}) {
  const [colors, setColors] = useState<string[]>(() => initialColors || []);
  const [lockedColors, setLockedColors] = useState<boolean[]>([false, false, false, false, false]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
    // Generate a random base color with controlled saturation and brightness
    const baseColor: Color = chroma.random()
      .set('hsl.s', 0.6 + Math.random() * 0.2) // Higher saturation for vibrant base
      .set('hsl.l', 0.4 + Math.random() * 0.2); // Controlled lightness
    
    // Generate harmonious colors using color theory
    const newColors = [
      baseColor.hex(), // Base color
      chroma.mix(baseColor, baseColor.set('hsl.h', '+30'), 0.5) // Analogous 1
        .set('hsl.s', 0.7)
        .set('hsl.l', 0.5)
        .hex(),
      chroma.mix(baseColor, baseColor.set('hsl.h', '+60'), 0.3) // Analogous 2
        .saturate(1)
        .set('hsl.l', 0.6)
        .hex(),
      baseColor.set('hsl.h', '+180') // Complementary
        .set('hsl.s', 0.8)
        .set('hsl.l', 0.5)
        .hex(),
      chroma.mix(baseColor.set('hsl.h', '+180'), baseColor, 0.3) // Split complementary
        .set('hsl.s', 0.7)
        .set('hsl.l', 0.45)
        .hex(),
    ];

    // Ensure minimum contrast between adjacent colors
    const adjustedColors = newColors.map((color, i) => {
      if (i === 0) return color;
      const prevColor = chroma(newColors[i - 1]);
      const currentColor = chroma(color);
      const contrast = chroma.contrast(prevColor, currentColor);
      
      if (contrast < 1.5) {
        return currentColor
          .set('hsl.l', currentColor.get('hsl.l') + 0.2)
          .saturate(1)
          .hex();
      }
      return color;
    });

    setColors(prev => 
      prev.length === 0 ? adjustedColors : prev.map((color, index) => 
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

  // Generate initial palette only if there are no colors
  useEffect(() => {
    if (colors.length === 0) {
      generateNewPalette();
    }
  }, []); // Run only once on mount

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
