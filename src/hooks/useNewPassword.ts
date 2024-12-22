import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { NewPasswordState } from '../types/auth';
import { updateUserPassword } from '../utils/auth';
import { toast } from 'sonner';

export const useNewPassword = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<NewPasswordState>({
    password: '',
    confirmPassword: '',
    loading: false,
    error: null,
  });

  // Log when the component mounts with the reset code
  useEffect(() => {
    const code = searchParams.get('code');
    console.log('Reset password page loaded with code:', code ? 'present' : 'missing');
  }, [searchParams]);

  const handleSubmit = async (): Promise<boolean> => {
    const code = searchParams.get('code');
    if (!code) {
      setState(prev => ({ ...prev, error: 'Invalid reset link' }));
      toast.error('Invalid reset link');
      return false;
    }

    if (state.password !== state.confirmPassword) {
      setState(prev => ({ ...prev, error: 'Passwords do not match' }));
      toast.error('Passwords do not match');
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    console.log('Attempting to update password...');
    
    const { error } = await updateUserPassword(state.password, code);

    if (error) {
      console.error('Password update failed:', error);
      setState(prev => ({ ...prev, loading: false, error }));
      toast.error(error);
      return false;
    }

    setState(prev => ({ ...prev, loading: false }));
    toast.success('Password updated successfully!');
    return true;
  };

  return {
    state,
    setPassword: (password: string) => setState(prev => ({ ...prev, password })),
    setConfirmPassword: (confirmPassword: string) => setState(prev => ({ ...prev, confirmPassword })),
    handleSubmit,
  };
};