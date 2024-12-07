import { TinyColor } from '@ctrl/tinycolor';

type ColorCharacteristic = {
  brightness: 'dark' | 'medium' | 'light';
  saturation: 'muted' | 'vibrant';
  temperature: 'warm' | 'cool' | 'neutral';
};

function getColorCharacteristics(color: string): ColorCharacteristic {
  const tinyColor = new TinyColor(color);
  const { h, s, l } = tinyColor.toHsl();

  // Determine brightness
  const brightness = l < 0.3 ? 'dark' : l > 0.7 ? 'light' : 'medium';

  // Determine saturation
  const saturation = s < 0.3 ? 'muted' : 'vibrant';

  // Determine temperature based on hue
  let temperature: 'warm' | 'cool' | 'neutral';
  if (h >= 0 && h < 45 || h >= 315) { // reds
    temperature = 'warm';
  } else if (h >= 45 && h < 180) { // yellows, greens
    temperature = h < 90 ? 'warm' : 'cool';
  } else if (h >= 180 && h < 315) { // cyans, blues, purples
    temperature = 'cool';
  } else {
    temperature = 'neutral';
  }

  return { brightness, saturation, temperature };
}

export function generatePaletteName(colors: string[]): string {
  // Analyze all colors in the palette
  const characteristics = colors.map(getColorCharacteristics);
  
  // Get dominant characteristics
  const dominantTemp = characteristics.reduce((acc, char) => {
    acc[char.temperature] = (acc[char.temperature] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dominantSat = characteristics.reduce((acc, char) => {
    acc[char.saturation] = (acc[char.saturation] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Generate adjectives based on dominant characteristics
  const adjectives: string[] = [];
  
  // Add temperature-based adjective
  if (dominantTemp.warm > dominantTemp.cool) {
    adjectives.push('Warm');
  } else if (dominantTemp.cool > dominantTemp.warm) {
    adjectives.push('Cool');
  } else {
    adjectives.push('Balanced');
  }

  // Add saturation-based adjective
  if (dominantSat.vibrant > dominantSat.muted) {
    adjectives.push('Vibrant');
  } else {
    adjectives.push('Muted');
  }

  // Add time-based suffix for uniqueness
  const timestamp = new Date().getTime().toString().slice(-4);

  return `${adjectives.join(' ')} Palette ${timestamp}`;
}
