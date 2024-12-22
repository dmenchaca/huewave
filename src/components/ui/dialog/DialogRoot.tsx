import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useEffect, useCallback } from 'react';
import { useDialogState } from '../../../hooks/useDialogState';

interface DialogRootProps extends DialogPrimitive.DialogProps {
  dialogId: string;
}

export const DialogRoot = ({ 
  dialogId, 
  open, 
  children, 
  onOpenChange,
  ...props 
}: DialogRootProps) => {
  const { openDialog, closeDialog } = useDialogState();

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (newOpen) {
      openDialog(dialogId);
    } else {
      closeDialog(dialogId);
    }
    onOpenChange?.(newOpen);
  }, [dialogId, openDialog, closeDialog, onOpenChange]);

  // Ensure dialog state is cleaned up on unmount
  useEffect(() => {
    if (open) {
      openDialog(dialogId);
    }
    return () => {
      closeDialog(dialogId);
    };
  }, [dialogId, open, openDialog, closeDialog]);

  return (
    <DialogPrimitive.Root 
      open={open} 
      onOpenChange={handleOpenChange}
      {...props}
    >
      {children}
    </DialogPrimitive.Root>
  );
};