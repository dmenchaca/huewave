import { useEffect, useState } from "react";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import ColorPalette from "../components/ColorPalette";
import PaletteControls from "../components/PaletteControls";
import SavedPalettesDropdown from "../components/SavedPalettesDropdown";
import SavePaletteDialog from "../components/SavePaletteDialog";
import LoadingOverlay from "../components/LoadingOverlay";
import { useColorPalette } from "../hooks/use-color-palette";
import { useUser } from "../hooks/use-user";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

export default function HomePage() {
  // Core state management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  
  // Authentication and color palette hooks
  const { user, logout, isLoading, isFetching } = useUser();
  const { 
    colors,
    setColors,
    lockedColors,
    toggleLock,
    darkMode,
    toggleDarkMode,
    generateNewPalette,
    handleColorChange
  } = useColorPalette({ 
    isDialogOpen,
    initialColors: selectedPalette?.colors 
  });

  // Handle palette synchronization when user auth state changes
  useEffect(() => {
    const syncPalette = async () => {
      if (user) {
        try {
          const response = await fetch('/api/palettes/latest');
          if (response.ok) {
            const latestPalette = await response.json();
            if (latestPalette) {
              setSelectedPalette(latestPalette);
              setColors(latestPalette.colors);
            }
          }
        } catch (error) {
          console.error('Error fetching latest palette:', error);
        }
      } else {
        // Only reset selected palette when user logs out, keep colors for guest mode
        setSelectedPalette(null);
      }
    };

    syncPalette();
  }, [user, setColors]); // Include setColors in dependencies

  // Space key handler for generating new palettes
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

  const handlePaletteSave = (palette: Palette) => {
    setSelectedPalette(palette);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-4 py-2 md:py-0 md:h-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
          <h1 className="text-2xl font-bold">Color palette generator</h1>
          <div className="w-full md:w-48 h-10">
            {isFetching ? (
              <div className="h-full">
                <LoadingOverlay />
              </div>
            ) : user && (
              <SavedPalettesDropdown 
                selectedPalette={selectedPalette}
                onPaletteSelect={(palette) => {
                  setSelectedPalette(palette);
                  setColors(palette.colors);
                }}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {!isLoading && (
            <>
              <div className="flex items-center gap-2 flex-shrink-0">
                <SavePaletteDialog 
                  colors={colors} 
                  isOpen={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  onSaveAttempt={!user ? () => setIsAuthDialogOpen(true) : undefined}
                  selectedPalette={selectedPalette}
                  onSaveSuccess={handlePaletteSave}
                />
                {!user && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => setIsAuthDialogOpen(true)}
                      className="whitespace-nowrap"
                    >
                      Login
                    </Button>
                    <AuthDialog
                      isOpen={isAuthDialogOpen}
                      onOpenChange={setIsAuthDialogOpen}
                      customTitle="You are almost there"
                      onSuccess={(palette) => {
                        setSelectedPalette(palette);
                        setIsAuthDialogOpen(false);
                      }}
                    />
                  </>
                )}
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle theme"
            className="flex-shrink-0"
          >
            {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          <div className="flex-shrink-0">
            {!isLoading && user && (
              <Button variant="outline" onClick={() => logout()} className="whitespace-nowrap">
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8">
          <ColorPalette 
            colors={colors}
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
