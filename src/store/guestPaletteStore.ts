import { create } from 'zustand';
import { Color } from '../types';

interface GuestPalette {
  name: string;
  colors: Color[];
}

interface GuestPaletteState {
  pendingPalette: GuestPalette | null;
  setPendingPalette: (palette: GuestPalette | null) => void;
}

export const useGuestPaletteStore = create<GuestPaletteState>((set) => ({
  pendingPalette: null,
  setPendingPalette: (palette) => set({ pendingPalette: palette }),
}));