import { useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuthStore } from '../../store/authStore';

export const useAuth = () => {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);
};