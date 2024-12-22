import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { FormInput } from '../forms/FormInput';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface DangerZoneProps {
  onClose: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ onClose }) => {
  const { deleteAccount } = useAuthStore();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        Danger Zone
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Once you delete your account, there is no going back. This action is permanent.
      </p>
      <div className="space-y-2">
        <FormInput
          value={deleteConfirmation}
          onChange={(e) => setDeleteConfirmation(e.target.value)}
          placeholder='Type "DELETE" to confirm'
        />
        <Button
          onClick={handleDeleteAccount}
          disabled={deleteConfirmation !== 'DELETE' || isDeleting}
          variant="destructive"
          className="w-full"
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </div>
    </div>
  );
};