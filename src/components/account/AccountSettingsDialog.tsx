import React from 'react';
import { Dialog } from '../ui/dialog';
import { AccountSettings } from './AccountSettings';

interface AccountSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountSettingsDialog: React.FC<AccountSettingsDialogProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog.Root dialogId="account-settings-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Header>
          <Dialog.Title>Account Settings</Dialog.Title>
          <Dialog.Description>
            Manage your account details and preferences
          </Dialog.Description>
        </Dialog.Header>
        <AccountSettings onClose={onClose} />
      </Dialog.Content>
    </Dialog.Root>
  );
};