import React, { useState } from 'react';
import { Dialog } from '../ui/dialog';
import { FormInput } from '../forms/FormInput';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface EmailVerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newEmail: string;
}

export const EmailVerificationDialog: React.FC<EmailVerificationDialogProps> = ({
  isOpen,
  onClose,
  newEmail,
}) => {
  const { updateEmail } = useAuthStore();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await updateEmail(newEmail, code);
      toast.success('Email updated successfully');
      onClose();
    } catch (error) {
      toast.error('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root dialogId="email-verification-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Header>
          <Dialog.Title>Verify your new email</Dialog.Title>
          <Dialog.Description>
            We sent you a six digit confirmation code to {newEmail}. Please enter it below to confirm your new email address.
          </Dialog.Description>
        </Dialog.Header>

        <form onSubmit={handleVerify} className="space-y-4">
          <FormInput
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            pattern="\d{6}"
            className="text-center text-2xl tracking-widest"
          />
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || code.length !== 6}
            >
              Verify
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};