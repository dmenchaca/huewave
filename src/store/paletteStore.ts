import { create } from 'zustand';
import { Color } from '../types';
import { savePalette as savePaletteToDb, getUserPalettes, updatePalette, deletePalette } from '../lib/palettes';

interface SavedPalette {
  id: string;
  name: string;
  colors: Color[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface PaletteState {
  savedPalettes: SavedPalette[];
  currentPalette: SavedPalette | null;
  loading: boolean;
  error: string | null;
  fetchPalettes: (userId: string) => Promise<void>;
  savePalette: (name: string, colors: Color[], userId: string) => Promise<void>;
  updatePalette: (id: string, name: string, colors: Color[]) => Promise<void>;
  deletePalette: (id: string) => Promise<void>;
  setCurrentPalette: (palette: SavedPalette | null) => void;
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  savedPalettes: [],
  currentPalette: null,
  loading: false,
  error: null,

  fetchPalettes: async (userId) => {
    if (get().loading) return;
    try {
      set({ loading: true, error: null });
      const palettes = await getUserPalettes(userId);
      set({ savedPalettes: palettes });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  savePalette: async (name, colors, userId) => {
    if (get().loading) return;
    try {
      set({ loading: true, error: null });
      const newPalette = await savePaletteToDb(name, colors, userId);
      set(state => ({ 
        savedPalettes: [...state.savedPalettes, newPalette],
        currentPalette: newPalette
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePalette: async (id, name, colors) => {
    if (get().loading) return;
    try {
      set({ loading: true, error: null });
      await updatePalette(id, { name, colors });
      set(state => ({
        savedPalettes: state.savedPalettes.map(p => 
          p.id === id ? { ...p, name, colors } : p
        ),
        currentPalette: state.currentPalette?.id === id 
          ? { ...state.currentPalette, name, colors }
          : state.currentPalette
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  deletePalette: async (id) => {
    if (get().loading) return;
    try {
      set({ loading: true, error: null });
      await deletePalette(id);
      set(state => ({
        savedPalettes: state.savedPalettes.filter(p => p.id !== id),
        currentPalette: state.currentPalette?.id === id ? null : state.currentPalette
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setCurrentPalette: (palette) => {
    const current = get().currentPalette;
    if (JSON.stringify(current) !== JSON.stringify(palette)) {
      set({ currentPalette: palette });
    }
  },
}));