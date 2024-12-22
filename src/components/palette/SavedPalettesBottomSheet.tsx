import React from 'react';
import { Sheet, BottomSheetContent, SheetHeader } from '../ui/sheet';
import { PaletteSearch } from './PaletteSearch';
import { MobilePaletteList } from './MobilePaletteList';
import { usePaletteStore } from '../../store/paletteStore';

interface SavedPalettesBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedPalettesBottomSheet: React.FC<SavedPalettesBottomSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const { savedPalettes } = usePaletteStore();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BottomSheetContent className="h-[85vh] flex flex-col">
        <SheetHeader
          title="Your Palettes"
          description="View and manage your saved color palettes"
        />
        <div className="flex-1 overflow-hidden">
          <PaletteSearch />
          <div className="overflow-y-auto h-full">
            <MobilePaletteList 
              palettes={savedPalettes} 
              onClose={onClose}
            />
          </div>
        </div>
      </BottomSheetContent>
    </Sheet>
  );
};