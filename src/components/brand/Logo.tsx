import React from 'react';
import { shouldUseWhiteText } from '../../utils/colors';

interface LogoProps {
  backgroundColor?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ 
  backgroundColor = '#ffffff',
  onClick 
}) => {
  const useWhiteText = shouldUseWhiteText(backgroundColor);
  
  return (
    <button
      onClick={onClick}
      className={`
        text-xl font-bold transition-opacity hover:opacity-80
        text-gray-800 dark:text-white
        md:text-inherit md:dark:text-inherit
        ${useWhiteText ? 'md:text-white' : 'md:text-gray-800'}
      `}
    >
      HueWave
    </button>
  );
};