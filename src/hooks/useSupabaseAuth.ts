import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePaletteStore } from '../store/paletteStore';

export const useSupabaseAuth = () => {
  const { setUser } = useAuthStore();
  const { fetchPalettes } = usePaletteStore();
  const { user } = useAuthStore();

  const handleAuthChange = useCallback((session: any) => {
    setUser(session?.user ?? null);
  }, [setUser]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      handleAuthChange(session);
    });

    return () => subscription.unsubscribe();
  }, [handleAuthChange]);

  useEffect(() => {
    if (user) {
      fetchPalettes(user.id);
    }
  }, [user, fetchPalettes]);

  return { user };
};