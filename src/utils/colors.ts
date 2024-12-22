import { Color } from '../types';

export const generateRandomHex = (): string => {
  const letters = '0123456789ABCDEF';
  let hex = '#';
  for (let i = 0; i < 6; i++) {
    hex += letters[Math.floor(Math.random() * 16)];
  }
  return hex;
};

export const isValidHex = (hex: string): string | false => {
  const hexRegex = /^#?([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
  const normalizedHex = hex.startsWith('#') ? hex : `#${hex}`;
  
  if (!hexRegex.test(normalizedHex)) {
    return false;
  }
  
  if (normalizedHex.length === 4) {
    const r = normalizedHex[1];
    const g = normalizedHex[2];
    const b = normalizedHex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  
  return normalizedHex;
};

export const getLuminance = (hex: string): number => {
  const rgb = hex.replace(/^#/, '').match(/.{2}/g)?.map(x => parseInt(x, 16)) || [0, 0, 0];
  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const shouldUseWhiteText = (hex: string): boolean => {
  const luminance = getLuminance(hex);
  return luminance < 0.55; // Threshold for using white text
};

export const generateHarmoniousColors = (count: number): string[] => {
  return Array(count).fill(null).map(() => generateRandomHex());
};

export const generateNewColors = (prevColors: Color[]): Color[] => {
  const newHexColors = generateHarmoniousColors(5);
  
  return prevColors.map((color, index) => ({
    hex: color.locked ? color.hex : newHexColors[index],
    locked: color.locked,
  }));
};