import { create } from 'zustand';

interface DialogState {
  openDialogs: Set<string>;
  isAnyDialogOpen: boolean;
  openDialog: (id: string) => void;
  closeDialog: (id: string) => void;
  getDialogState: (id: string) => boolean;
}

export const useDialogState = create<DialogState>((set, get) => ({
  openDialogs: new Set<string>(),
  isAnyDialogOpen: false,
  
  openDialog: (id: string) => {
    set(state => {
      const newOpenDialogs = new Set(state.openDialogs);
      newOpenDialogs.add(id);
      return {
        openDialogs: newOpenDialogs,
        isAnyDialogOpen: true
      };
    });
  },
  
  closeDialog: (id: string) => {
    set(state => {
      const newOpenDialogs = new Set(state.openDialogs);
      newOpenDialogs.delete(id);
      return {
        openDialogs: newOpenDialogs,
        isAnyDialogOpen: newOpenDialogs.size > 0
      };
    });
  },
  
  getDialogState: (id: string) => {
    return get().openDialogs.has(id);
  }
}));