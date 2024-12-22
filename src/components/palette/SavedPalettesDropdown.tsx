import React from 'react';
import { Palette } from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';
import { PaletteSearch } from './PaletteSearch';
import { PaletteList } from './PaletteList';
import { usePaletteStore } from '../../store/paletteStore';

export const SavedPalettesDropdown: React.FC = () => {
  const { savedPalettes, currentPalette } = usePaletteStore();

  const buttonLabel = currentPalette 
    ? currentPalette.name 
    : 'Saved Palettes';

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
        <Palette className="w-4 h-4" />
        <span className="max-w-[150px] truncate">{buttonLabel}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="w-64">
        <PaletteSearch />
        <PaletteList palettes={savedPalettes} />
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};