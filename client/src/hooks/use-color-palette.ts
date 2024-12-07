import { useState, useCallback, useEffect } from "react";
import chroma, { Color } from "chroma-js";

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen = false, initialColors }: UseColorPaletteProps = {}) {
  const [colors, setColors] = useState<string[]>(() => initialColors ?? []);
  const [lockedColors, setLockedColors] = useState<boolean[]>([false, false, false, false, false]);
  const [colorHistory, setColorHistory] = useState<string[][]>(() => 
    initialColors ? [[...initialColors]] : [[]]
  );
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const addToHistory = useCallback((newColors: string[]) => {
    setColorHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      return [...newHistory, [...newColors]];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const generateNewPalette = useCallback(() => {
    // Generate a random base color with controlled saturation and brightness
    const baseColor: Color = chroma.random()
      .set('hsl.s', 0.6 + Math.random() * 0.2)
      .set('hsl.l', 0.4 + Math.random() * 0.2);
    
    // Generate harmonious colors using color theory
    const adjustedColors = [
      baseColor.hex(),
      chroma.mix(baseColor, baseColor.set('hsl.h', '+30'), 0.5)
        .set('hsl.s', 0.7)
        .set('hsl.l', 0.5)
        .hex(),
      chroma.mix(baseColor, baseColor.set('hsl.h', '+60'), 0.3)
        .saturate(1)
        .set('hsl.l', 0.6)
        .hex(),
      baseColor.set('hsl.h', '+180')
        .set('hsl.s', 0.8)
        .set('hsl.l', 0.5)
        .hex(),
      chroma.mix(baseColor.set('hsl.h', '+180'), baseColor, 0.3)
        .set('hsl.s', 0.7)
        .set('hsl.l', 0.45)
        .hex(),
    ];

    setColors(prevColors => {
      // Apply locked colors
      const newColors = prevColors.length === 0 
        ? [...adjustedColors] 
        : adjustedColors.map((color, index) => lockedColors[index] ? prevColors[index] : color);

      // Add to history if colors changed
      if (JSON.stringify(prevColors) !== JSON.stringify(newColors)) {
        addToHistory(newColors);
      }
      
      return newColors;
    });
  }, [lockedColors, addToHistory]);

  // Handle history updates when colors change
  const handleColorWithHistory = useCallback((index: number, newColor: string) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = newColor;
      if (prev[index] !== newColor) {
        addToHistory(next);
      }
      return next;
    });
  }, [addToHistory]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    handleColorWithHistory(index, newColor);
  }, [handleColorWithHistory]);

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
    if (!initialColors || initialColors.length === 0) {
      generateNewPalette();
    }
  }, [generateNewPalette, initialColors]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setColors([...colorHistory[newIndex]]);
    }
  }, [historyIndex, colorHistory]);

  const redo = useCallback(() => {
    if (historyIndex < colorHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setColors([...colorHistory[newIndex]]);
    }
  }, [historyIndex, colorHistory]);

  return {
    colors,
    setColors,
    lockedColors,
    darkMode,
    generateNewPalette,
    toggleLock,
    toggleDarkMode,
    handleColorChange,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < colorHistory.length - 1,
  };
}