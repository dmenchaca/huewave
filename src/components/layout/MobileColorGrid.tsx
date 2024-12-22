import React from 'react';
import { Color } from '../../types';
import { MobileColorBlock } from './MobileColorBlock';

interface MobileColorGridProps {
  colors: Color[];
  onToggleLock: (index: number) => void;
  onColorChange: (index: number, hex: string) => void;
}

export const MobileColorGrid: React.FC<MobileColorGridProps> = ({
  colors,
  onToggleLock,
  onColorChange
}) => (
  <div className="flex flex-col h-full">
    {colors.map((color, index) => (
      <div key={index} className="flex-1">
        <MobileColorBlock
          color={color}
          onToggleLock={() => onToggleLock(index)}
          onColorChange={(hex) => onColorChange(index, hex)}
          className="h-full"
        />
      </div>
    ))}
  </div>
);