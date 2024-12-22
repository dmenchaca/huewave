import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';
import { usePaletteStore } from '../../store/paletteStore';
import { usePaletteSearch } from '../../hooks/usePaletteSearch';
import { SavedPalette } from '../../types';
import { toast } from 'sonner';
import { DeletePaletteDialog } from './DeletePaletteDialog';

interface PaletteListProps {
  palettes: SavedPalette[];
}

export const PaletteList: React.FC<PaletteListProps> = ({ palettes }) => {
  const { setCurrentPalette, deletePalette, currentPalette } = usePaletteStore();
  const { searchQuery } = usePaletteSearch();
  const [paletteToDelete, setPaletteToDelete] = useState<SavedPalette | null>(null);

  const filteredPalettes = React.useMemo(() => {
    if (!searchQuery.trim()) return palettes;
    const query = searchQuery.toLowerCase();
    return palettes.filter(palette => 
      palette.name.toLowerCase().includes(query)
    );
  }, [palettes, searchQuery]);

  const handleSelect = (palette: SavedPalette) => {
    setCurrentPalette(palette);
    toast.success(`Loaded palette: ${palette.name}`);
  };

  const handleDelete = async () => {
    if (!paletteToDelete) return;
    
    try {
      await deletePalette(paletteToDelete.id);
      toast.success(`Deleted palette: ${paletteToDelete.name}`);
      setPaletteToDelete(null);
    } catch (error) {
      toast.error('Failed to delete palette');
    }
  };

  if (filteredPalettes.length === 0) {
    return (
      <DropdownMenu.Item disabled className="text-gray-500 dark:text-gray-400">
        {searchQuery ? 'No matching palettes' : 'No saved palettes'}
      </DropdownMenu.Item>
    );
  }

  return (
    <>
      <div className="max-h-64 overflow-y-auto py-1">
        {filteredPalettes.map((palette) => {
          const isSelected = currentPalette?.id === palette.id;
          return (
            <DropdownMenu.Item
              key={palette.id}
              className={`flex items-center gap-2 cursor-pointer px-2 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isSelected ? 'bg-gray-50 dark:bg-gray-800/50' : ''
              }`}
            >
              <span 
                className={`flex-1 truncate cursor-pointer ${
                  isSelected ? 'font-medium' : ''
                }`}
                onClick={() => handleSelect(palette)}
              >
                {palette.name}
              </span>
              <div className="flex gap-2 items-center">
                <div className="flex gap-1">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPaletteToDelete(palette);
                  }}
                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
                </button>
              </div>
            </DropdownMenu.Item>
          );
        })}
      </div>

      {paletteToDelete && (
        <DeletePaletteDialog
          isOpen={!!paletteToDelete}
          onClose={() => setPaletteToDelete(null)}
          palette={paletteToDelete}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};