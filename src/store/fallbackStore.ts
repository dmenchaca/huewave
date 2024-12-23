import { Color, SavedPalette } from '../types';

const STORAGE_KEY = 'huewave_palettes';

export const getFallbackPalettes = (): SavedPalette[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveFallbackPalette = (name: string, colors: Color[]): SavedPalette => {
  const palettes = getFallbackPalettes();
  const newPalette: SavedPalette = {
    id: crypto.randomUUID(),
    name,
    colors,
    user_id: 'demo-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  palettes.push(newPalette);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  return newPalette;
};

export const updateFallbackPalette = (id: string, name: string, colors: Color[]): void => {
  const palettes = getFallbackPalettes();
  const index = palettes.findIndex(p => p.id === id);
  
  if (index !== -1) {
    palettes[index] = {
      ...palettes[index],
      name,
      colors,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
  }
};

export const deleteFallbackPalette = (id: string): void => {
  const palettes = getFallbackPalettes();
  const filtered = palettes.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};