import React from 'react';
import { ColorBlock } from '../ColorBlock';
import { MobileColorGrid } from './MobileColorGrid';
import { Color } from '../../types';

interface ColorGridProps {
  colors: Color[];
  onToggleLock: (index: number) => void;
  onColorChange: (index: number, hex: string) => void;
}

export const ColorGrid: React.FC<ColorGridProps> = ({ 
  colors, 
  onToggleLock,
  onColorChange
}) => (
  <>
    {/* Desktop Layout */}
    <div className="hidden md:flex w-full h-full">
      {colors.map((color, index) => (
        <ColorBlock
          key={index}
          color={color}
          onToggleLock={() => onToggleLock(index)}
          onColorChange={(hex) => onColorChange(index, hex)}
        />
      ))}
    </div>

    {/* Mobile Layout */}
    <div className="md:hidden flex-1 flex flex-col">
      <MobileColorGrid
        colors={colors}
        onToggleLock={onToggleLock}
        onColorChange={onColorChange}
      />
    </div>
  </>
);