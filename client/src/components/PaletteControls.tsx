
import { useColorPalette } from "../hooks/use-color-palette";

export default function PaletteControls() {
  const { colors, lockedColors, toggleLock } = useColorPalette();

  return (
    <div className="grid grid-cols-5 gap-2 p-4">
      {colors.map((_, index) => (
        <button
          key={index}
          onClick={() => toggleLock(index)}
          className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
        >
          {lockedColors[index] ? "🔒" : "🔓"}
        </button>
      ))}
    </div>
  );
}
