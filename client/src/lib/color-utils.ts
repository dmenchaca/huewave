import { TinyColor } from '@ctrl/tinycolor';

interface IceCreamFlavor {
  name: string;
  color: {
    h: [number, number]; // [min, max] hue range
    s: [number, number]; // [min, max] saturation range
    l: [number, number]; // [min, max] lightness range
  };
}

const iceCreamFlavors: IceCreamFlavor[] = [
  {
    name: "Vanilla",
    color: { h: [40, 60], s: [0, 0.15], l: [0.85, 1] }
  },
  {
    name: "Chocolate",
    color: { h: [20, 40], s: [0.3, 0.6], l: [0.2, 0.4] }
  },
  {
    name: "Strawberry",
    color: { h: [350, 360], s: [0.3, 0.7], l: [0.7, 0.9] }
  },
  {
    name: "Mint",
    color: { h: [150, 170], s: [0.2, 0.4], l: [0.7, 0.9] }
  },
  {
    name: "Blueberry",
    color: { h: [220, 240], s: [0.3, 0.6], l: [0.4, 0.6] }
  },
  {
    name: "Caramel",
    color: { h: [25, 45], s: [0.4, 0.7], l: [0.4, 0.6] }
  },
  {
    name: "Pistachio",
    color: { h: [90, 120], s: [0.2, 0.4], l: [0.6, 0.8] }
  },
  {
    name: "Grape",
    color: { h: [270, 290], s: [0.3, 0.6], l: [0.3, 0.5] }
  },
  {
    name: "Coffee",
    color: { h: [25, 40], s: [0.4, 0.7], l: [0.2, 0.4] }
  },
  {
    name: "Cotton Candy",
    color: { h: [300, 320], s: [0.2, 0.4], l: [0.8, 0.9] }
  }
];

function findClosestFlavor(color: string): string {
  const tinyColor = new TinyColor(color);
  const { h, s, l } = tinyColor.toHsl();
  
  // Normalize hue to 0-360 range
  const normalizedHue = h < 0 ? h + 360 : h;

  // Find the flavor with the closest color match
  let closestFlavor = iceCreamFlavors[0];
  let smallestDifference = Number.MAX_VALUE;

  for (const flavor of iceCreamFlavors) {
    const hDiff = Math.min(
      Math.abs(normalizedHue - flavor.color.h[0]),
      Math.abs(normalizedHue - flavor.color.h[1])
    );
    const sDiff = Math.min(
      Math.abs(s - flavor.color.s[0]),
      Math.abs(s - flavor.color.s[1])
    );
    const lDiff = Math.min(
      Math.abs(l - flavor.color.l[0]),
      Math.abs(l - flavor.color.l[1])
    );

    const totalDiff = hDiff * 0.5 + sDiff * 0.25 + lDiff * 0.25;

    if (totalDiff < smallestDifference) {
      smallestDifference = totalDiff;
      closestFlavor = flavor;
    }
  }

  return closestFlavor.name;
}

// Ice cream related adjectives and descriptions
const iceCreamAdjectives = [
  "Creamy", "Dreamy", "Frosty", "Smooth", "Sweet", "Delightful", "Indulgent",
  "Luxurious", "Velvety", "Heavenly", "Whimsical", "Divine"
];

const toppings = [
  "Sprinkles", "Drizzle", "Swirl", "Ripple", "Crunch", "Chips", "Chunks"
];

const specialNames = [
  "Parlor Special", "Scoops Supreme", "Ice Cream Dream", "Frozen Fantasy",
  "Sundae Sensation", "Creamy Creation", "Sweet Symphony"
];

export function generatePaletteName(colors: string[]): string {
  // Get ice cream flavors for each color
  const flavorNames = colors.map(findClosestFlavor);
  
  // Count flavor occurrences to find dominant flavors
  const flavorCounts = flavorNames.reduce((acc, flavor) => {
    acc[flavor] = (acc[flavor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Sort flavors by count (descending) and then alphabetically
  const sortedFlavors = Object.entries(flavorCounts)
    .sort(([flavorA, countA], [flavorB, countB]) => {
      if (countA !== countB) return countB - countA;
      return flavorA.localeCompare(flavorB);
    })
    .map(([flavor]) => flavor);

  // Select up to 2 dominant flavors
  const dominantFlavors = sortedFlavors.slice(0, 2);

  if (dominantFlavors.length === 1) {
    return `${dominantFlavors[0]} Swirl`;
  } else {
    return `${dominantFlavors[0]} ${dominantFlavors[1]}`;
  }
}
