
import { useState, useCallback, useEffect } from 'react';
import { generateAnalogousColors, generateComplementaryColors } from '../lib/color-utils';

interface ColorPaletteConfig {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen, initialColors }: ColorPaletteConfig = {}) {
  const [colors, setColors] = useState<string[]>(initialColors || ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF']);
  const [lockedColors, setLockedColors] = useState<boolean[]>(Array(5).fill(false));
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem("darkMode");
    return savedMode ? JSON.parse(savedMode) : false;
  });

  // Handle dark mode class on document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const generateNewPalette = useCallback(() => {
    console.log('[ColorPalette] Generating new palette via spacebar');
    console.log('[ColorPalette] Current locked states:', lockedColors);

    setColors(prevColors => {
      return prevColors.map((color, index) => {
        if (lockedColors[index]) {
          return color;
        }
        const newColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        console.log(`[ColorPalette] Generated new color for index ${index}: ${newColor}`);
        return newColor;
      });
    });
  }, [lockedColors]);

  const toggleLock = useCallback((index: number) => {
    setLockedColors(prev => {
      const newLocked = [...prev];
      newLocked[index] = !newLocked[index];
      return newLocked;
    });
  }, []);

  const handleColorChange = useCallback((index: number, color: string) => {
    setColors(prev => {
      const newColors = [...prev];
      newColors[index] = color;
      return newColors;
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

import { useState, useCallback, useEffect, useRef } from "react";
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
  }, []); // No dependencies needed since we use ref

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
