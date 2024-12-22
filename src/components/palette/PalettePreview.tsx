import React from 'react';
import { Color } from '../../types';

interface PalettePreviewProps {
  colors: Color[];
}

export const PalettePreview: React.FC<PalettePreviewProps> = ({ colors }) => (
  <div className="flex gap-2 h-8">
    {colors.map((color, index) => (
      <div
        key={index}
        className="flex-1 rounded"
        style={{ backgroundColor: color.hex }}
      />
    ))}
  </div>
);