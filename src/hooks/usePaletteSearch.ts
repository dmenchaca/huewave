import { create } from 'zustand';

interface PaletteSearchState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const usePaletteSearch = create<PaletteSearchState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));