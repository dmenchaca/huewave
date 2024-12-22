import React from 'react';
import { Search } from 'lucide-react';

interface SavedPalettesSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SavedPalettesSearch: React.FC<SavedPalettesSearchProps> = ({ value, onChange }) => (
  <div className="relative px-2 py-2 border-b dark:border-gray-700">
    <div className="relative">
      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search palettes..."
        className="w-full pl-8 pr-2 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200 dark:placeholder-gray-400"
      />
    </div>
  </div>
);