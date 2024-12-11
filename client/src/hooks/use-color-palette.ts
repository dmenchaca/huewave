import { useState, useCallback, useEffect } from "react";
import chroma from "chroma-js";
import Cookies from 'js-cookie';

const PALETTE_COOKIE_NAME = 'palette_colors';
const COOKIE_EXPIRY = 7; // Days

interface UseColorPaletteProps {
  isDialogOpen?: boolean;
  initialColors?: string[];
}

export function useColorPalette({ isDialogOpen = false, initialColors }: UseColorPaletteProps = {}) {
  const [colors, setColors] = useState<string[]>(() => {
    try {
      const savedColors = Cookies.get(PALETTE_COOKIE_NAME);
      if (savedColors) {
        const parsed = JSON.parse(savedColors);
        if (Array.isArray(parsed) && 
            parsed.length <= 5 && 
            parsed.every(color => 
              typeof color === 'string' && 
              /^#[0-9A-Fa-f]{6}$/.test(color)
            )
        ) {
          return parsed;
        } else {
          Cookies.remove(PALETTE_COOKIE_NAME);
          console.warn('Invalid color data found in cookie, clearing...');
        }
      }
    } catch (error) {
      Cookies.remove(PALETTE_COOKIE_NAME);
      console.error('Failed to parse colors from cookie:', error);
    }
    return initialColors || [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });

  const generateNewPalette = useCallback(() => {
  const themes = [
    { name: "nature", baseHues: [120, 60, 30] }, // Greens, yellows, browns
    { name: "muted-vintage", baseHues: [0, 15, 300] }, // Reds, purples
    { name: "cool-blues", baseHues: [200, 210, 230] }, // Blues
  ];

  // Pick a random theme
  const theme = themes[Math.floor(Math.random() * themes.length)];
  const baseHue = theme.baseHues[Math.floor(Math.random() * theme.baseHues.length)];
  const baseColor = chroma.hsl(baseHue, 0.6, 0.5); // Mid-saturation and mid-lightness

  const randomLightness = () => 0.05 + Math.random() * 0.85; // Range from very dark to safe bright
  const randomSaturation = () => Math.random() * 0.4 + 0.4; // Balanced saturation

  const newColors = [];
  const colorSet = new Set();

  for (let i = 0; i < 5; i++) {
    let newColor;
    let attempts = 0;

    do {
      if (i === 0) {
        // Base color
        newColor = baseColor.hex();
      } else if (i === 4) {
        // Add a neutral color (e.g., gray, off-white, or near black)
        newColor = chroma.hsl(0, 0, randomLightness() * 0.8).hex(); // Narrower lightness for neutrals
      } else {
        // Generate theme-based colors
        newColor = chroma.hsl(
          (baseHue + i * 30 + Math.random() * 20 - 10) % 360, // Slight random shift
          randomSaturation(),
          randomLightness()
        ).hex();
      }
      attempts++;
    } while (
      (colorSet.has(newColor) || newColor.toLowerCase() === '#ffffff') && attempts < 10
    );

    colorSet.add(newColor);
    newColors.push(newColor);
  }

  // Ensure no duplicates and no whites in the final palette
  const adjustedColors = newColors.map(color => {
    let adjustedColor = color;
    let attempts = 0;

    while (adjustedColor.toLowerCase() === '#ffffff' && attempts < 10) {
      // Regenerate if the color is white
      adjustedColor = chroma.hsl(
        Math.random() * 360,
        randomSaturation(),
        randomLightness()
      ).hex();
      attempts++;
    }

    return adjustedColor;
  });

  // Update the state with the new palette
  setColors(adjustedColors);
}, []);

  useEffect(() => {
    if (colors.length === 0 && !initialColors?.length && process.env.NODE_ENV !== 'test') {
      generateNewPalette();
    }
  }, [colors.length, initialColors, generateNewPalette]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  const handleColorChange = useCallback((index: number, newColor: string) => {
    setColors(prev => {
      const next = [...prev];
      next[index] = newColor;
      return next;
    });
  }, []);

  useEffect(() => {
    if (colors.length > 0 && colors.length <= 5) {
      if (colors.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
        try {
          Cookies.set(PALETTE_COOKIE_NAME, JSON.stringify(colors), { expires: COOKIE_EXPIRY });
        } catch (error) {
          console.error('Failed to save colors to cookie:', error);
          Cookies.remove(PALETTE_COOKIE_NAME);
        }
      } else {
        console.warn('Invalid color values detected, not saving to cookie');
      }
    }
  }, [colors]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return {
    colors,
    setColors,
    darkMode,
    generateNewPalette,
    toggleDarkMode,
    handleColorChange,
  };
}