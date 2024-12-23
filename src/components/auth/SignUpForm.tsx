import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { FormInput } from '../forms/FormInput';
import { Button } from '../common/Button';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '../../lib/supabase';

interface SignUpFormProps {
  onSuccess: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const { signUp, loading, error, clearError } = useAuthStore();

  React.useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  React.useEffect(() => {
    if (!isSupabaseConfigured) {
      toast.info('Running in demo mode - data will be stored locally', {
        duration: 5000
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const { error } = await signUp(email, password);
    if (!error) {
      onSuccess();
      toast.success('Account created successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FormInput
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <FormInput
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      
      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
};