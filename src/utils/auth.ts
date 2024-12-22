import { supabase } from '../lib/supabase';

/**
 * Get the appropriate redirect URL based on the environment
 */
export const getRedirectUrl = (): string => {
  const siteUrl = import.meta.env.VITE_SITE_URL;
  
  if (!siteUrl) {
    return import.meta.env.DEV 
      ? 'http://localhost:5173/auth/callback'
      : 'https://huewave.co/auth/callback';
  }

  return `${siteUrl}/auth/callback`;
};

/**
 * Clean up URL parameters after authentication
 */
export const cleanupAuthParams = () => {
  console.log('Cleaning up auth parameters from URL');
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
};

/**
 * Update user's email
 */
export const updateUserEmail = async (email: string): Promise<{ error: string | null }> => {
  try {
    console.log('Attempting to update email to:', email);
    const { error } = await supabase.auth.updateUser({ 
      email 
    });

    if (error) throw error;
    console.log('Email update initiated successfully');
    return { error: null };
  } catch (error) {
    console.error('Email update error:', error);
    return { error: (error as Error).message };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (email: string): Promise<{ error: string | null }> => {
  try {
    console.log('Sending password reset email to:', email);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_SITE_URL}/reset-password`,
    });

    if (error) throw error;
    console.log('Password reset email sent successfully');
    return { error: null };
  } catch (error) {
    console.error('Password reset error:', error);
    return { error: (error as Error).message };
  }
};

/**
 * Update user's password using reset token
 */
export const updateUserPassword = async (newPassword: string, code: string): Promise<{ error: string | null }> => {
  try {
    console.log('Starting password update process with code');
    
    if (!code) {
      console.error('No reset code provided');
      throw new Error('Reset token not found');
    }

    // First exchange the code for a session
    console.log('Exchanging code for session');
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Session exchange error:', sessionError);
      throw sessionError;
    }

    // Now update the password
    console.log('Updating password');
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });
    
    if (error) {
      console.error('Password update error:', error);
      throw error;
    }
    
    console.log('Password updated successfully');
    return { error: null };
  } catch (error) {
    console.error('Password update error:', error);
    return { error: (error as Error).message };
  }
};