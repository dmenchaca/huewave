import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePaletteStore } from '../../store/paletteStore';
import { usePaletteSearch } from '../../hooks/usePaletteSearch';
import { SavedPalette } from '../../types';
import { toast } from 'sonner';
import { DeletePaletteDialog } from './DeletePaletteDialog';

interface MobilePaletteListProps {
  palettes: SavedPalette[];
  onClose?: () => void;
}

export const MobilePaletteList: React.FC<MobilePaletteListProps> = ({ 
  palettes,
  onClose 
}) => {
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
    onClose?.();
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
      <div className="px-4 py-3 text-gray-500 dark:text-gray-400">
        {searchQuery ? 'No matching palettes' : 'No saved palettes'}
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {filteredPalettes.map((palette) => {
          const isSelected = currentPalette?.id === palette.id;
          return (
            <div
              key={palette.id}
              className={`flex items-center gap-2 p-4 ${
                isSelected ? 'bg-gray-50 dark:bg-gray-800/50' : ''
              }`}
            >
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => handleSelect(palette)}
              >
                <span className={`block truncate ${
                  isSelected ? 'font-medium' : ''
                }`}>
                  {palette.name}
                </span>
                <div className="flex gap-1 mt-1">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => setPaletteToDelete(palette)}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400" />
              </button>
            </div>
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