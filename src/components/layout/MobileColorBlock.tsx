import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Copy } from 'lucide-react';
import { Color } from '../../types';
import { isValidHex, shouldUseWhiteText } from '../../utils/colors';

interface MobileColorBlockProps {
  color: Color;
  onToggleLock: () => void;
  onColorChange: (hex: string) => void;
  className?: string;
}

export const MobileColorBlock: React.FC<MobileColorBlockProps> = ({
  color,
  onToggleLock,
  onColorChange,
  className
}) => {
  const [hexValue, setHexValue] = useState(color.hex);
  const [isEditing, setIsEditing] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const useWhiteText = shouldUseWhiteText(color.hex);

  useEffect(() => {
    setHexValue(color.hex);
    setIsValid(true);
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

  const getTextColorClass = useWhiteText ? 'text-white' : 'text-gray-800';
  const getBackgroundClass = useWhiteText 
    ? 'bg-white/10 hover:bg-white/20' 
    : 'bg-black/10 hover:bg-black/20';

  return (
    <div 
      className={`h-full w-full flex items-center justify-between px-6 ${className || ''}`}
      style={{ backgroundColor: isValid ? hexValue : color.hex }}
    >
      {isEditing ? (
        <input
          type="text"
          value={hexValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
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
          className={`text-lg font-mono ${getTextColorClass}`}
        >
          {color.hex.toUpperCase()}
        </button>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={copyToClipboard}
          className={`p-2 rounded-full backdrop-blur-sm ${getBackgroundClass}`}
          aria-label="Copy color code"
        >
          <Copy className={`w-5 h-5 ${getTextColorClass}`} />
        </button>
        <button
          onClick={onToggleLock}
          className={`p-2 rounded-full backdrop-blur-sm ${getBackgroundClass}`}
          aria-label={color.locked ? "Unlock color" : "Lock color"}
        >
          {color.locked ? (
            <Lock className={`w-5 h-5 ${getTextColorClass}`} />
          ) : (
            <Unlock className={`w-5 h-5 ${getTextColorClass}`} />
          )}
        </button>
      </div>
    </div>
  );
};