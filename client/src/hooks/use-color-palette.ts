import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";

export function useColorPalette() {
  const [colors, setColors] = useState<string[]>([]);
  const [lockedColors, setLockedColors] = useState<boolean[]>([false, false, false, false, false]);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
    const baseColor = chroma.random();
    const scheme = chroma.scale([
      baseColor,
      baseColor.set("hsl.h", "+60"),
      baseColor.set("hsl.h", "+120"),
      baseColor.set("hsl.h", "+180"),
      baseColor.set("hsl.h", "+240"),
    ]);

    setColors(prev => {
      const newColors = scheme.colors(5).map(color => color.hex());
      return prev.map((color, index) => 
        lockedColors[index] ? color : newColors[index]
      );
    });
  }, [lockedColors]);

  const toggleLock = useCallback((index: number) => {
    setLockedColors(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem("darkMode", JSON.stringify(next));
      return next;
    });
  }, []);

  // Generate initial palette
  useEffect(() => {
    generateNewPalette();
  }, []);

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
