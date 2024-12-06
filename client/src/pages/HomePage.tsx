import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import ColorPalette from "../components/ColorPalette";
import PaletteControls from "../components/PaletteControls";
import SavedPalettesDropdown from "../components/SavedPalettesDropdown";
import SavePaletteDialog from "../components/SavePaletteDialog";
import { useColorPalette } from "../hooks/use-color-palette";
import { useUser } from "../hooks/use-user";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

export default function HomePage() {
  const { user, logout } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  const { 
    colors,
    setColors,
    lockedColors,
    toggleLock,
    darkMode,
    toggleDarkMode,
    generateNewPalette
  } = useColorPalette({ isDialogOpen });

  const handlePaletteSave = (palette: Palette) => {
    setSelectedPalette(palette);
    setColors(palette.colors);
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if any input element is focused
      if (document.activeElement instanceof HTMLInputElement || 
          document.activeElement instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (e.code === "Space" && !isDialogOpen) {
        e.preventDefault();
        generateNewPalette();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [generateNewPalette, isDialogOpen]);

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Color Palette Generator</h1>
          {user && (
            <SavedPalettesDropdown 
              selectedPalette={selectedPalette}
              onPaletteSelect={(palette) => {
                setSelectedPalette(palette);
                setColors(palette.colors);
              }}
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <SavePaletteDialog 
              colors={colors} 
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              selectedPalette={selectedPalette}
              onSaveSuccess={handlePaletteSave}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
          {user ? (
            <Button variant="outline" onClick={() => logout()}>
              Logout
            </Button>
          ) : (
            <Button variant="outline" asChild>
              <a href="/auth">Login</a>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <ColorPalette 
            colors={colors}
            lockedColors={lockedColors}
            onToggleLock={toggleLock}
          />
          
          <PaletteControls />
        </div>
      </main>
    </div>
  );
}
