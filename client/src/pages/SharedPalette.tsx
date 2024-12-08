import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useColorPalette } from "../hooks/use-color-palette";
import ColorPalette from "../components/ColorPalette";
import PaletteControls from "../components/PaletteControls";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";

export default function SharedPalette() {
  const { colors } = useParams();
  const { 
    setColors, 
    colors: currentColors,
    lockedColors,
    toggleLock,
    darkMode,
    toggleDarkMode,
    handleColorChange 
  } = useColorPalette();

  useEffect(() => {
    if (colors) {
      // Split the colors string and validate each hex color
      const colorArray = colors.split('-').map(c => `#${c}`);
      if (colorArray.every(color => /^#[0-9A-Fa-f]{6}$/.test(color))) {
        setColors(colorArray);
      }
    }
  }, [colors, setColors]);

  if (!colors) {
    return <div>Invalid palette URL</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-2 md:py-0 md:h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shared Palette</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label="Toggle theme"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </Button>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <ColorPalette 
            colors={currentColors}
            lockedColors={lockedColors}
            onToggleLock={toggleLock}
            onColorChange={handleColorChange}
          />
          <PaletteControls />
        </div>
      </main>
    </div>
  );
}
