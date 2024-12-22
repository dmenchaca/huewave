import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy } from 'lucide-react';
import { Color } from '../types';
import { isValidHex, shouldUseWhiteText } from '../utils/colors';

interface ColorBlockProps {
  color: Color;
  onToggleLock: () => void;
  onColorChange: (hex: string) => void;
}

export const ColorBlock: React.FC<ColorBlockProps> = ({ 
  color, 
  onToggleLock,
  onColorChange 
}) => {
  const [hexValue, setHexValue] = useState(color.hex);
  const [isEditing, setIsEditing] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const useWhiteText = shouldUseWhiteText(color.hex);

  useEffect(() => {
    setHexValue(color.hex);
  }, [color.hex]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleChange = (value: string) => {
    setHexValue(value);
    const validHex = isValidHex(value);
    setIsValid(!!validHex);
    if (validHex) {
      onColorChange(validHex);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (!isValid) {
      setHexValue(color.hex);
      setIsValid(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    } else if (e.key === 'Escape') {
      setHexValue(color.hex);
      setIsValid(true);
      setIsEditing(false);
    }
  };

  const getTextColorClass = useWhiteText ? 'text-white' : 'text-gray-800';
  const getBackgroundClass = useWhiteText 
    ? 'bg-white/10 hover:bg-white/20' 
    : 'bg-black/10 hover:bg-black/20';

  return (
    <div 
      className="relative h-screen w-full group"
      style={{ backgroundColor: isValid ? hexValue : color.hex }} 
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center min-h-[200px]">
        <button
          onClick={onToggleLock}
          className={`p-4 rounded-full backdrop-blur-sm mb-4 transition-all ${getBackgroundClass} ${
            color.locked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label={color.locked ? "Unlock color" : "Lock color"}
        >
          {color.locked ? (
            <Lock className={`w-6 h-6 ${getTextColorClass}`} />
          ) : (
            <Unlock className={`w-6 h-6 ${getTextColorClass}`} />
          )}
        </button>
        
        <button
          onClick={copyToClipboard}
          className={`p-4 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all ${getBackgroundClass}`}
          aria-label="Copy color code"
        >
          <Copy className={`w-6 h-6 ${getTextColorClass}`} />
        </button>
        
        <div className="mt-4 min-h-[40px] flex items-center justify-center">
          {isEditing ? (
            <input
              type="text"
              value={hexValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className={`w-28 px-2 py-1 text-center backdrop-blur-sm border rounded text-lg font-mono focus:outline-none ${
                useWhiteText 
                  ? 'border-white/20 focus:border-white/40 text-white bg-white/10'
                  : 'border-black/20 focus:border-black/40 text-gray-800 bg-black/10'
              }`}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className={`w-28 px-2 py-1 font-mono text-lg rounded transition-colors hover:backdrop-blur-sm ${
                useWhiteText 
                  ? 'text-white hover:bg-white/10'
                  : 'text-gray-800 hover:bg-black/10'
              }`}
            >
              {color.hex.toUpperCase()}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};