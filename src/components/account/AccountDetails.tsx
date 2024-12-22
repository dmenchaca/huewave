import React from 'react';
import { FormInput } from '../forms/FormInput';
import { useAuthStore } from '../../store/authStore';

export const AccountDetails: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Account Details</h3>
      <FormInput
        type="email"
        value={user?.email || ''}
        disabled
        placeholder="Email address"
      />
    </div>
  );
};