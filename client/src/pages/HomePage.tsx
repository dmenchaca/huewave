
import { useEffect, useState } from "react";
import ColorPalette from "@/components/ColorPalette";
import PaletteControls from "@/components/PaletteControls";
import { useColorPalette } from "@/hooks/use-color-palette";
import AuthDialog from "@/components/AuthDialog";
import SavePaletteDialog from "@/components/SavePaletteDialog";
import EditPaletteDialog from "@/components/EditPaletteDialog";
import { useUser } from "@/hooks/use-user";
import UserProfileDropdown from "@/components/UserProfileDropdown";
import SavedPalettesDropdown from "@/components/SavedPalettesDropdown";

export default function HomePage() {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSaveAsNewDialogOpen, setIsSaveAsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPaletteId, setSelectedPaletteId] = useState<number | null>(null);

  const { 
    colors, 
    lockedColors, 
    darkMode, 
    generateNewPalette, 
    toggleLock, 
    toggleDarkMode,
    handleColorChange,
    setColors
  } = useColorPalette();

  const { user } = useUser();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && 
          e.type === 'keydown' && 
          !e.repeat && 
          e.isTrusted && 
          !(e.target instanceof HTMLInputElement) && 
          !(e.target instanceof HTMLButtonElement) &&
          !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        e.stopPropagation();
        generateNewPalette();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [generateNewPalette]);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
      <header className="container mx-auto px-4 py-2 md:py-0 md:h-16 flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-2">
          <img src="/images/huewave-icon.png" alt="HueWave Logo" className="w-8 h-8" />
          <h1 className="text-lg font-semibold">HueWave</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <SavedPalettesDropdown 
            onSelect={(paletteId) => {
              setSelectedPaletteId(paletteId);
              setIsEditDialogOpen(true);
            }} 
          />
          {!user && (
            <button
              onClick={() => setIsAuthDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
            >
              Sign In
            </button>
          )}
          {user && <UserProfileDropdown />}
        </div>
      </header>

      <main className="flex-1 grid grid-rows-[1fr,auto]">
        <ColorPalette
          colors={colors}
          lockedColors={lockedColors}
          onToggleLock={toggleLock}
          onColorChange={handleColorChange}
        />
        
        <PaletteControls
          onSave={() => setIsSaveAsNewDialogOpen(true)}
          onToggleDarkMode={toggleDarkMode}
          darkMode={darkMode}
        />
      </main>

      <AuthDialog 
        open={isAuthDialogOpen} 
        onOpenChange={setIsAuthDialogOpen} 
      />

      <SavePaletteDialog
        open={isSaveAsNewDialogOpen}
        onOpenChange={setIsSaveAsNewDialogOpen}
        colors={colors}
      />

      <EditPaletteDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        paletteId={selectedPaletteId}
      />
    </div>
  );
}
