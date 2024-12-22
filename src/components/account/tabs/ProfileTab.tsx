import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FormInput } from '../../forms/FormInput';
import { Button } from '../../common/Button';
import { toast } from 'sonner';

export const ProfileTab: React.FC = () => {
  const { user, updateEmail } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter your password to update email');
      return;
    }

    setLoading(true);
    try {
      await updateEmail(email, password);
      toast.success('Email updated successfully');
      setPassword('');
    } catch (error) {
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpdateEmail} className="space-y-4">
      <FormInput
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FormInput
        label="Confirm Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password to confirm changes"
        required
      />
      <Button
        type="submit"
        disabled={loading || !email || !password}
        className="w-full"
      >
        {loading ? 'Updating...' : 'Update Email'}
      </Button>
    </form>
  );
};