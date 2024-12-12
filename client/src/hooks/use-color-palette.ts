
import { useState, useCallback, useEffect, useRef } from "react";
import chroma from "chroma-js";

interface ColorPaletteConfig {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen, initialColors }: ColorPaletteConfig = {}) {
  const [colors, setColors] = useState<string[]>(() => 
    initialColors?.length ? initialColors : Array(5).fill(0).map(() => chroma.random().hex())
  );
  
  const [lockedColors, setLockedColors] = useState<boolean[]>(() => 
    Array(initialColors?.length || 5).fill(false)
  );
  
  // Use ref to avoid regeneration cycles
  const lockedColorsRef = useRef(lockedColors);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  // Keep ref in sync with state
  useEffect(() => {
    lockedColorsRef.current = lockedColors;
  }, [lockedColors]);

  // Only sync colors when initialColors changes
  useEffect(() => {
    if (initialColors?.length) {
      setColors(initialColors);
      setLockedColors(prev => {
        if (prev.length !== initialColors.length) {
          return Array(initialColors.length).fill(false);
        }
        return prev;
      });
    }
  }, [initialColors]);

  // Handle dark mode class on document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleLock = useCallback((index: number) => {
    console.log(`[ColorPalette] Attempting to toggle lock for index ${index}`);
    setLockedColors(prev => {
      const newLocks = [...prev];
      newLocks[index] = !newLocks[index];
      console.log(`[ColorPalette] Lock state updated for index ${index}:`, {
        previous: prev[index],
        new: newLocks[index]
      });
      return newLocks;
    });
  }, []);

  const generateNewPalette = useCallback(() => {
    console.log('[ColorPalette] Generating new palette via spacebar');
    setColors(prevColors => {
      const currentLocks = lockedColorsRef.current;
      console.log('[ColorPalette] Current locked states:', currentLocks);
      
      return prevColors.map((color, index) => {
        if (currentLocks[index]) {
          console.log(`[ColorPalette] Color ${index} is locked, keeping ${color}`);
          return color;
        }
        const newColor = chroma.random().hex();
        console.log(`[ColorPalette] Generated new color for index ${index}: ${newColor}`);
        return newColor;
      });
    });
  }, []);

  const handleColorChange = useCallback((index: number, color: string) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = color;
      return updated;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', JSON.stringify(newValue));
      }
      return newValue;
    });
  }, []);

  return {
    colors,
    setColors,
    lockedColors,
    darkMode,
    toggleLock,
    toggleDarkMode,
    generateNewPalette,
    handleColorChange
  };
}
