import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";
import Cookies from 'js-cookie';

const PALETTE_COOKIE_NAME = 'palette_colors';
const LOCKED_COLORS_KEY = 'locked_colors';
const COOKIE_EXPIRY = 7; // Days

export interface ColorPaletteHook {
  colors: string[];
  lockedColors: boolean[];
  setColors: (colors: string[]) => void;
  generateNewPalette: () => void;
  toggleLock: (index: number) => void;
  handleColorChange: (index: number, color: string) => void;
}

export function useColorPalette({ initialColors }: { initialColors?: string[] } = {}): ColorPaletteHook {
  const [colors, setColors] = useState(initialColors?.length ? initialColors : generateRandomColors());
  const [lockedColors, setLockedColors] = useState<boolean[]>(() => {
    console.log('[ColorPalette] Initializing lock state...');
    const initialState = Array(5).fill(false);
    console.log('[ColorPalette] Initial lock state:', initialState);
    return initialState;
  });

  const toggleLock = useCallback((index: number) => {
    console.log(`[ColorPalette] Attempting to toggle lock for color at index ${index}`);
    setLockedColors((prev) => {
      const newLocks = [...prev];
      newLocks[index] = !newLocks[index];
      console.log(`[ColorPalette] Color ${index} is now ${newLocks[index] ? 'LOCKED' : 'UNLOCKED'}`);
      console.log('[ColorPalette] Updated lock state:', newLocks);
      return newLocks;
    });
  }, []);

  const generateNewPalette = useCallback(() => {
    console.log('[ColorPalette] Generating new palette...');
    console.log('[ColorPalette] Current lock state:', lockedColors);

    setColors((prevColors) => {
      const newColors = prevColors.map((color, index) => {
        if (lockedColors[index]) {
          console.log(`[ColorPalette] Color ${index} is locked, keeping ${color}`);
          return color;
        }
        const newColor = generateRandomColor();
        console.log(`[ColorPalette] Generated new color for index ${index}: ${newColor}`);
        return newColor;
      });
      console.log('[ColorPalette] New palette generated:', newColors);
      return newColors;
    });
  }, [lockedColors]);

  const handleColorChange = useCallback((index: number, color: string) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = color;
      return updated;
    });
  }, []);


  return {
    colors,
    lockedColors,
    setColors,
    generateNewPalette,
    toggleLock,
    handleColorChange
  };
}

function generateRandomColors(): string[] {
  return Array(5).fill(0).map(() => generateRandomColor());
}

function generateRandomColor(): string {
  return chroma.random().hex();
}