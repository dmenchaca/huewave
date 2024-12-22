import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNewPassword } from '../../hooks/useNewPassword';
import { FormInput } from '../forms/FormInput';
import { Button } from '../common/Button';

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const { state, setPassword, setConfirmPassword, handleSubmit } = useNewPassword();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Attempting to update password...');
    const success = await handleSubmit();
    
    if (success) {
      console.log('Password updated successfully, redirecting to home...');
      navigate('/');
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormInput
        id="password"
        label="New Password"
        type="password"
        value={state.password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter new password"
        required
        autoFocus
      />

      <FormInput
        id="confirmPassword"
        label="Confirm Password"
        type="password"
        value={state.confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
      />
      
      <Button
        type="submit"
        disabled={state.loading || !state.password || !state.confirmPassword}
        className="w-full"
      >
        {state.loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
};