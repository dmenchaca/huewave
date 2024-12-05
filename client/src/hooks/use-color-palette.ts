import { useState, useCallback, useEffect } from "react";
import chroma, { Color } from "chroma-js";

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
}

export function useColorPalette({ isDialogOpen = false }: UseColorPaletteProps = {}) {
  const [colors, setColors] = useState<string[]>([]);
  const [lockedColors, setLockedColors] = useState<boolean[]>([false, false, false, false, false]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
    // Generate a random base color with good saturation and brightness
    const baseColor: Color = chroma.random().set('hsl.s', 0.5 + Math.random() * 0.3);
    
    // Generate harmonious colors using different methods
    const newColors = [
      baseColor.hex(), // Base color
      baseColor.set('hsl.h', '+72').set('hsl.s', 0.6 + Math.random() * 0.2).hex(), // Analogous
      baseColor.set('hsl.h', '+144').set('hsl.l', 0.4 + Math.random() * 0.2).hex(), // Triadic
      baseColor.set('hsl.h', '+180').set('hsl.s', 0.5 + Math.random() * 0.3).hex(), // Complementary
      baseColor.set('hsl.h', '+216').set('hsl.l', 0.6 + Math.random() * 0.2).hex(), // Split complementary
    ];

    setColors(prev => 
      prev.length === 0 ? newColors : prev.map((color, index) => lockedColors[index] ? color : newColors[index])
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

  // Generate initial palette
  useEffect(() => {
    generateNewPalette();
  }, [generateNewPalette]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return {
    colors,
    lockedColors,
    darkMode,
    generateNewPalette,
    toggleLock,
    toggleDarkMode,
  };
}
