import { create } from 'zustand';
import { User } from '@supabase/supabase-js';
import { signIn as signInWithSupabase, signUp as signUpWithSupabase, signOut as signOutWithSupabase } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateEmail: (newEmail: string, code: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { user, error } = await signInWithSupabase(email, password);
      if (error) {
        set({ error });
        return { error };
      }
      if (JSON.stringify(user) !== JSON.stringify(get().user)) {
        set({ user });
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { user, error } = await signUpWithSupabase(email, password);
      if (error) {
        set({ error });
        return { error };
      }
      if (JSON.stringify(user) !== JSON.stringify(get().user)) {
        set({ user });
      }
      return { error: null };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage });
      return { error: errorMessage };
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await signOutWithSupabase();
      if (error) {
        set({ error });
        return;
      }
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  updateEmail: async (newEmail, code) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token: code,
        type: 'email_change'
      });
      if (error) throw error;
      
      // Update local user state with new email
      const currentUser = get().user;
      if (currentUser) {
        set({ user: { ...currentUser, email: newEmail } });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePassword: async (currentPassword, newPassword) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      if (error) throw error;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteAccount: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.admin.deleteUser(get().user?.id || '');
      if (error) throw error;
      set({ user: null });
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  setUser: (user) => {
    const currentUser = get().user;
    if (JSON.stringify(user) !== JSON.stringify(currentUser)) {
      set({ user });
    }
  },
  
  clearError: () => set({ error: null })
}));