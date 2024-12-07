import { useState, useCallback, useEffect } from "react";
import chroma, { Color } from "chroma-js";

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen = false, initialColors }: UseColorPaletteProps = {}) {
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Initialize colors and history state
  const [colors, setColors] = useState<string[]>(() => 
    initialColors?.length ? [...initialColors] : new Array(5).fill('#FFFFFF')
  );
  
  const [lockedColors, setLockedColors] = useState<boolean[]>(new Array(5).fill(false));
  const [colorHistory, setColorHistory] = useState<string[][]>(() => {
    const initial = initialColors?.length ? [...initialColors] : new Array(5).fill('#FFFFFF');
    return [[...initial]];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const addToHistory = useCallback((newColors: string[]) => {
    // Validate new colors
    if (!Array.isArray(newColors) || newColors.length !== 5 || newColors.some(c => !c)) {
      console.warn('Invalid color array provided');
      return;
    }

    setColorHistory(prev => {
      const lastColors = prev[historyIndex];
      // Only add to history if colors have changed
      if (lastColors && JSON.stringify(lastColors) === JSON.stringify(newColors)) {
        return prev;
      }
      
      // Remove any future states if we're not at the end
      const newHistory = [...prev.slice(0, historyIndex + 1), [...newColors]];
      
      // Update colors and history index in the next tick to prevent immediate re-renders
      requestAnimationFrame(() => {
        setColors(newColors);
        setHistoryIndex(prev => prev + 1);
      });
      
      return newHistory;
    });
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0 || !colorHistory[0]) {
      return; // Already at the beginning or invalid history
    }

    setHistoryIndex(prev => {
      const newIndex = Math.max(0, prev - 1);
      const targetColors = colorHistory[newIndex];
      
      // Ensure we have valid colors to revert to
      if (Array.isArray(targetColors) && targetColors.length > 0) {
        setColors([...targetColors]);
        return newIndex;
      }
      
      // If somehow we don't have valid colors, stay at current state
      return prev;
    });
  }, [colorHistory, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= colorHistory.length - 1) {
      return; // Already at the latest state
    }

    setHistoryIndex(prev => {
      const newIndex = Math.min(colorHistory.length - 1, prev + 1);
      const targetColors = colorHistory[newIndex];
      
      // Ensure we have valid colors to move forward to
      if (Array.isArray(targetColors) && targetColors.length > 0) {
        setColors([...targetColors]);
        return newIndex;
      }
      
      // If somehow we don't have valid colors, stay at current state
      return prev;
    });
  }, [colorHistory, historyIndex]);

  // Add keyboard event listeners for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl/Cmd + Z/Y
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z') ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Handle color updates with history tracking
  const handleColorWithHistory = useCallback((index: number, newColor: string) => {
    if (lockedColors[index]) {
      return; // Don't update locked colors
    }

    setColors(prev => {
      if (prev[index] === newColor) {
        return prev; // No change needed
      }
      
      const next = [...prev];
      next[index] = newColor;
      
      // Immediately add to history instead of using requestAnimationFrame
      addToHistory(next);
      return next;
    });
  }, [addToHistory, lockedColors]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    handleColorWithHistory(index, newColor);
  }, [handleColorWithHistory]);

  const generateNewPalette = useCallback(() => {
    const baseColor: Color = chroma.random()
      .set('hsl.s', 0.6 + Math.random() * 0.2)
      .set('hsl.l', 0.4 + Math.random() * 0.2);
    
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

    // Apply locked colors and create new palette
    const newColors = adjustedColors.map((color, index) => 
      lockedColors[index] ? colors[index] : color
    );
    
    // Add to history immediately
    addToHistory(newColors);
  }, [colors, lockedColors, addToHistory]);

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

  // Generate initial palette only once when component mounts if no initial colors
  useEffect(() => {
    if (isInitializing && !initialColors?.length) {
      generateNewPalette();
      setIsInitializing(false);
    }
  }, [isInitializing, initialColors, generateNewPalette]);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

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
    isLoading: isInitializing,
  };
}
