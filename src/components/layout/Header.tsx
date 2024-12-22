import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { SavedPalettesDropdown } from '../palette/SavedPalettesDropdown';
import { UserAccountDropdown } from '../account/UserAccountDropdown';
import { Logo } from '../brand/Logo';
import { PaletteActionsMenu } from '../palette/PaletteActionsMenu';
import { DeletePaletteDialog } from '../palette/DeletePaletteDialog';
import { MobileHeader } from './MobileHeader';
import { useAuthStore } from '../../store/authStore';
import { usePaletteStore } from '../../store/paletteStore';
import { Button } from '../common/Button';

interface HeaderProps {
  onOpenSave: () => void;
  onOpenAuth: () => void;
  onOpenMenu?: () => void;
  backgroundColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSave,
  onOpenAuth,
  onOpenMenu,
  backgroundColor = '#ffffff'
}) => {
  const { user } = useAuthStore();
  const { currentPalette, setCurrentPalette, deletePalette } = usePaletteStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleHomeClick = () => {
    window.location.reload();
  };

  const handleSaveAsNew = () => {
    setCurrentPalette(null);
    onOpenSave();
  };

  const handleDelete = async () => {
    if (!currentPalette) return;
    
    try {
      await deletePalette(currentPalette.id);
      setCurrentPalette(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete palette:', error);
    }
  };

  return (
    <>
      {/* Desktop Header */}
      <div className="hidden md:flex fixed top-4 w-full px-4 z-50 items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo backgroundColor={backgroundColor} onClick={handleHomeClick} />
          {user && <SavedPalettesDropdown />}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {currentPalette ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={onOpenSave}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Update
                  </Button>
                  <PaletteActionsMenu
                    palette={currentPalette}
                    onSaveAsNew={handleSaveAsNew}
                    onDelete={() => setShowDeleteDialog(true)}
                  />
                </div>
              ) : (
                <Button
                  onClick={onOpenSave}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Palette
                </Button>
              )}
              <UserAccountDropdown />
            </>
          ) : (
            <Button 
              onClick={onOpenAuth}
              variant="secondary"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <MobileHeader
          onOpenMenu={onOpenMenu || (() => {})}
          onOpenSave={onOpenSave}
          onOpenAuth={onOpenAuth}
          backgroundColor={backgroundColor}
        />
      </div>

      {currentPalette && showDeleteDialog && (
        <DeletePaletteDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          palette={currentPalette}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};