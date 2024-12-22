import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { AuthenticatedMenu } from './menu/AuthenticatedMenu';
import { GuestMenu } from './menu/GuestMenu';
import { Sheet, SideSheetContent, SheetHeader } from '../ui/sheet';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onManageAccount: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  onManageAccount,
}) => {
  const { user } = useAuthStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SideSheetContent>
        <SheetHeader title="Menu" />
        {user ? (
          <AuthenticatedMenu 
            onClose={onClose}
            onManageAccount={onManageAccount}
          />
        ) : (
          <GuestMenu onClose={onClose} />
        )}
      </SideSheetContent>
    </Sheet>
  );
};