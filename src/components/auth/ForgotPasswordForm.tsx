import React, { useState } from 'react';
import { usePasswordReset } from '../../hooks/usePasswordReset';
import { FormInput } from '../forms/FormInput';
import { Button } from '../common/Button';

export const ForgotPasswordForm: React.FC = () => {
  const { state, handleReset } = usePasswordReset();
  const [email, setEmail] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleReset(email);
  };

  if (state.success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We've sent you an email with instructions to reset your password.
          Please check your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormInput
        id="email"
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        autoFocus
      />
      
      <Button
        type="submit"
        disabled={state.loading || !email}
        className="w-full"
      >
        {state.loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
    </form>
  );
};