import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";

export interface ColorPaletteHook {
  colors: string[];
  lockedColors: boolean[];
  setColors: (colors: string[]) => void;
  generateNewPalette: () => void;
  toggleLock: (index: number) => void;
  handleColorChange: (index: number, color: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export function useColorPalette({ 
  initialColors,
  isDialogOpen 
}: { 
  initialColors?: string[];
  isDialogOpen?: boolean;
} = {}): ColorPaletteHook {
  const [colors, setColors] = useState<string[]>(() => 
    initialColors?.length ? initialColors : generateRandomColors()
  );
  
  const [lockedColors, setLockedColors] = useState<boolean[]>(() => 
    Array(initialColors?.length || 5).fill(false)
  );
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('darkMode');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  // Only sync colors when initialColors changes
  useEffect(() => {
    if (initialColors?.length) {
      setColors(initialColors);
      // Only reset locks if array length changes
      setLockedColors(prev => {
        if (prev.length !== initialColors.length) {
          return Array(initialColors.length).fill(false);
        }
        return prev;
      });
    }
  }, [initialColors]);

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
  }, []); // No dependencies to prevent unintended regeneration

  const generateNewPalette = useCallback(() => {
    console.log('[ColorPalette] Generating new palette via spacebar');
    setColors(prevColors => {
      // Get current locked state when generating
      const currentLockedColors = lockedColors;
      console.log('[ColorPalette] Current locked states:', currentLockedColors);
      
      return prevColors.map((color, index) => {
        if (currentLockedColors[index]) {
          console.log(`[ColorPalette] Color ${index} is locked, keeping ${color}`);
          return color;
        }
        const newColor = chroma.random().hex();
        console.log(`[ColorPalette] Generated new color for index ${index}: ${newColor}`);
        return newColor;
      });
    });
  }, [lockedColors]); // Include lockedColors in dependencies to ensure latest state

  const handleColorChange = useCallback((index: number, color: string) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = color;
      return updated;
    });
  }, []); // No dependencies needed for direct updates

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
    lockedColors,
    setColors,
    generateNewPalette,
    toggleLock,
    handleColorChange,
    darkMode,
    toggleDarkMode
  };
}

function generateRandomColors(): string[] {
  return Array(5).fill(0).map(() => chroma.random().hex());
}
