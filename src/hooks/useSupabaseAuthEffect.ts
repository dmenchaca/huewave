import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePaletteStore } from '../store/paletteStore';
import { cleanupAuthParams } from '../utils/auth';
import { toast } from 'sonner';

export const useSupabaseAuthEffect = () => {
  const { setUser } = useAuthStore();
  const { fetchPalettes } = usePaletteStore();
  const { user } = useAuthStore();

  // Handle URL code parameter for email confirmation
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      console.log('Password reset code detected:', code);
      cleanupAuthParams();
    }
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      console.log('Session state:', session ? 'Present' : 'None');
      
      setUser(session?.user ?? null);
      
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Password recovery event detected');
      }
      
      if (event === 'SIGNED_IN') {
        const isEmailConfirmation = new URLSearchParams(window.location.hash.slice(1)).get('type') === 'signup';
        if (isEmailConfirmation) {
          console.log('Email confirmation successful');
          toast.success('Email confirmed successfully!');
          cleanupAuthParams();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  // Handle fetching palettes when user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, fetching palettes');
      fetchPalettes(user.id);
    }
  }, [user?.id, fetchPalettes]);
};