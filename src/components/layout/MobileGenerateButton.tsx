import React from 'react';
import { Shuffle, Palette, Save } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { usePaletteStore } from '../../store/paletteStore';

interface MobileGenerateButtonProps {
  onClick: () => void;
  onOpenSave: () => void;
  onShowPalettes: () => void;
}

export const MobileGenerateButton: React.FC<MobileGenerateButtonProps> = ({
  onClick,
  onOpenSave,
  onShowPalettes
}) => {
  const { user } = useAuthStore();
  const { currentPalette } = usePaletteStore();
  
  const paletteButtonText = currentPalette ? currentPalette.name : 'Your palettes';

  return (
    <div className="h-14 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between px-4">
      {user && (
        <div className="flex items-center gap-2">
          <Button
            onClick={onShowPalettes}
            variant="secondary"
            className="text-sm flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            <span className="max-w-[100px] truncate">{paletteButtonText}</span>
          </Button>
          <Button
            onClick={onOpenSave}
            variant="secondary"
            className="text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
        </div>
      )}
      <Button
        onClick={onClick}
        variant="secondary"
        className="text-sm flex items-center gap-2 ml-auto"
      >
        <Shuffle className="w-4 h-4" />
        Generate
      </Button>
    </div>
  );
};