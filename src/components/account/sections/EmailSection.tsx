import React, { useState } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { FormInput } from '../../forms/FormInput';
import { Button } from '../../common/Button';
import { updateUserEmail } from '../../../utils/auth';
import { toast } from 'sonner';
import { EmailVerificationDialog } from '../dialogs/EmailVerificationDialog';

export const EmailSection = () => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email === user?.email) {
      toast.error('Please enter a different email address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updateUserEmail(email);
      if (error) throw error;
      
      setShowVerification(true);
      toast.success('Verification code sent to your new email address');
    } catch (error) {
      toast.error('Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Email</h3>
      <form onSubmit={handleUpdateEmail} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button
          type="submit"
          disabled={loading || !email || email === user?.email}
          className="w-full"
        >
          {loading ? 'Sending verification...' : 'Update email'}
        </Button>
      </form>

      <EmailVerificationDialog
        isOpen={showVerification}
        onClose={() => setShowVerification(false)}
        newEmail={email}
      />
    </div>
  );
};