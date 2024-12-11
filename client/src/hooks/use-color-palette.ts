
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
  const [lockedColors, setLockedColors] = useState(() => {
    const saved = localStorage.getItem(LOCKED_COLORS_KEY);
    return saved ? JSON.parse(saved) : Array(5).fill(false);
  });

  const toggleLock = useCallback((index: number) => {
    setLockedColors(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  }, []);

  const generateNewPalette = useCallback(() => {
    setColors(prevColors => 
      prevColors.map((color, index) => {
        if (lockedColors[index]) return color;
        return generateRandomColor();
      })
    );
  }, [lockedColors]);

  const handleColorChange = useCallback((index: number, color: string) => {
    setColors(prev => {
      const updated = [...prev];
      updated[index] = color;
      return updated;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCKED_COLORS_KEY, JSON.stringify(lockedColors));
  }, [lockedColors]);

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
