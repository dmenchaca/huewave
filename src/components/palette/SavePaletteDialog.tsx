import React, { useState, useEffect } from 'react';
import { Dialog } from '../ui/dialog';
import { usePaletteStore } from '../../store/paletteStore';
import { useAuthStore } from '../../store/authStore';
import { useGuestPaletteStore } from '../../store/guestPaletteStore';
import { Color } from '../../types';
import { FormInput } from '../forms/FormInput';
import { Button } from '../common/Button';
import { PalettePreview } from './PalettePreview';
import { toast } from 'sonner';

interface SavePaletteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  colors: Color[];
  onNeedAuth?: () => void;
}

export const SavePaletteDialog: React.FC<SavePaletteDialogProps> = ({
  isOpen,
  onClose,
  colors,
  onNeedAuth,
}) => {
  const [name, setName] = useState('');
  const { user } = useAuthStore();
  const { savePalette, updatePalette, loading, currentPalette } = usePaletteStore();
  const { setPendingPalette } = useGuestPaletteStore();

  // Set initial name when dialog opens
  useEffect(() => {
    if (isOpen && currentPalette) {
      setName(currentPalette.name);
    } else {
      setName('');
    }
  }, [isOpen, currentPalette]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setPendingPalette({ name, colors });
      onNeedAuth?.();
      onClose();
      return;
    }
    
    try {
      if (currentPalette) {
        await updatePalette(currentPalette.id, name, colors);
        toast.success('Palette updated successfully!');
      } else {
        await savePalette(name, colors, user.id);
        toast.success('Palette saved successfully!');
      }
      setName('');
      onClose();
    } catch (error) {
      toast.error(currentPalette ? 'Failed to update palette' : 'Failed to save palette');
    }
  };

  return (
    <Dialog.Root dialogId="save-palette-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{currentPalette ? 'Update Palette' : 'Save Palette'}</Dialog.Title>
          <Dialog.Description>
            {user 
              ? currentPalette
                ? 'Update your palette name or colors'
                : 'Give your palette a name to save it'
              : 'Create an account to save and manage your palettes'}
          </Dialog.Description>
        </Dialog.Header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            id="name"
            label="Palette Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="My awesome palette"
          />
          
          <PalettePreview colors={colors} />

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
              disabled={loading || !name.trim()}
            >
              {user 
                ? loading 
                  ? currentPalette ? 'Updating...' : 'Saving...'
                  : currentPalette ? 'Update Palette' : 'Save Palette'
                : 'Continue to Save'}
            </Button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};