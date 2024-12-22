import React from 'react';
import { Dialog } from '../ui/dialog';
import { Button } from '../common/Button';
import { SavedPalette } from '../../types';

interface DeletePaletteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  palette: SavedPalette;
  onConfirm: () => void;
}

export const DeletePaletteDialog: React.FC<DeletePaletteDialogProps> = ({
  isOpen,
  onClose,
  palette,
  onConfirm,
}) => {
  return (
    <Dialog.Root dialogId="delete-palette-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete palette "{palette.name}"?</Dialog.Title>
          <Dialog.Description>
            This action cannot be undone. This will permanently delete your palette "{palette.name}".
          </Dialog.Description>
        </Dialog.Header>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
};