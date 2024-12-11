
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
  const [colors, setColors] = useState(() => 
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

  // Sync colors and locks only when initialColors changes
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

  const toggleLock = useCallback((index: number) => {
    console.log(`[ColorPalette] Attempting to toggle lock for color ${index}:`, colors[index]);
    setLockedColors(prev => {
      const newLocks = [...prev];
      newLocks[index] = !newLocks[index];
      return newLocks;
    });
  }, []);

  const generateNewPalette = useCallback(() => {
    setColors(prevColors => 
      prevColors.map((color, index) => 
        lockedColors[index] ? color : chroma.random().hex()
      )
    );
  }, [lockedColors]);

  const handleColorChange = useCallback((index: number, color: string) => {
    console.log(`[ColorPalette] Manual color change at index ${index} to ${color}`);
    setColors(prev => {
      const updated = [...prev];
      updated[index] = color;
      return updated;
    });
  }, []);

  useEffect(() => {
    console.log('[ColorPalette] Colors or locks updated:', { colors, lockedColors });
  }, [colors, lockedColors]);

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
