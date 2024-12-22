import React from 'react';
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';
import { Button } from '../common/Button';
import { SavedPalette } from '../../types';

interface PaletteActionsMenuProps {
  palette: SavedPalette;
  onSaveAsNew: () => void;
  onDelete: () => void;
}

export const PaletteActionsMenu: React.FC<PaletteActionsMenuProps> = ({
  palette,
  onSaveAsNew,
  onDelete,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button
          variant="secondary"
          className="px-2 flex items-center justify-center"
          aria-label="More options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" className="w-48">
        <DropdownMenu.Item onClick={onSaveAsNew} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          <span>Save as new</span>
        </DropdownMenu.Item>
        
        <DropdownMenu.Separator />
        
        <DropdownMenu.Item 
          onClick={onDelete}
          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete palette</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};