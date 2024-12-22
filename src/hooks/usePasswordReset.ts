import { useState } from 'react';
import { PasswordResetState } from '../types/auth';
import { sendPasswordResetEmail } from '../utils/auth';
import { toast } from 'sonner';

export const usePasswordReset = () => {
  const [state, setState] = useState<PasswordResetState>({
    email: '',
    loading: false,
    success: false,
    error: null,
  });

  const handleReset = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await sendPasswordResetEmail(email);
    
    if (error) {
      setState(prev => ({ ...prev, loading: false, error }));
      toast.error(error);
      return;
    }

    setState(prev => ({ ...prev, loading: false, success: true }));
    toast.success('Password reset email sent! Please check your inbox.');
  };

  return { state, handleReset };
};