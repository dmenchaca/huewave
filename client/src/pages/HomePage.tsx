import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, SaveIcon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import ColorPalette from "../components/ColorPalette";
import PaletteControls from "../components/PaletteControls";
import SavedPalettesDropdown from "../components/SavedPalettesDropdown";
import SavePaletteDialog from "../components/SavePaletteDialog";
import UserProfileDropdown from "../components/UserProfileDropdown";
import LoadingOverlay from "../components/LoadingOverlay";
import { useColorPalette } from "../hooks/use-color-palette";
import { useUser } from "../hooks/use-user";
import { useToast } from "@/hooks/use-toast";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

export default function HomePage() {
  // Core state management
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaveAsNewDialogOpen, setIsSaveAsNewDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);

  // Authentication and color palette hooks
  const { user, logout, isLoading, isFetching } = useUser();
  const { toast } = useToast();
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
  }, [user, setColors]);

  // Space key handler for generating new palettes
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
          <div className="inline-flex items-center gap-2">
            <img src="/images/huewave-icon.png" alt="HueWave Logo" className="w-8 flex-shrink-0" />
            <h1 className="text-2xl font-bold leading-none pb-1">HueWave</h1>
          </div>
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
            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                // Show Update, Save as new, and Delete buttons for logged-in users
                <>
                  <SavePaletteDialog 
                    colors={colors} 
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    selectedPalette={selectedPalette}
                    onSaveSuccess={handlePaletteSave}
                    triggerContent={
                      <Button
                        variant="default"
                        className="flex items-center gap-2"
                      >
                        <SaveIcon className="h-4 w-4" />
                        Update
                      </Button>
                    }
                  />
                  <SavePaletteDialog 
                    colors={colors} 
                    isOpen={isSaveAsNewDialogOpen}
                    onOpenChange={setIsSaveAsNewDialogOpen}
                    onSaveSuccess={handlePaletteSave}
                    triggerContent={
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <SaveIcon className="h-4 w-4" />
                        Save as new
                      </Button>
                    }
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{selectedPalette?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your palette "{selectedPalette?.name}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            if (selectedPalette) {
                              try {
                                const response = await fetch(`/api/palettes/${selectedPalette.id}`, {
                                  method: 'DELETE',
                                  credentials: 'include'
                                });
                                
                                if (!response.ok) {
                                  throw new Error('Failed to delete palette');
                                }
                                
                                queryClient.invalidateQueries({ queryKey: ['palettes'] });
                                setSelectedPalette(null);
                                toast({
                                  title: "Success",
                                  description: "Palette deleted successfully",
                                });
                              } catch (error) {
                                toast({
                                  variant: "destructive",
                                  title: "Error",
                                  description: "Failed to delete palette",
                                });
                              }
                            }
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                // Show save button for non-logged-in users
                <SavePaletteDialog 
                  colors={colors} 
                  isOpen={isDialogOpen}
                  onOpenChange={setIsDialogOpen}
                  onSaveSuccess={(palette) => {
                    setSelectedPalette(palette);
                    setIsDialogOpen(false);
                  }}
                  onSaveAttempt={() => setIsAuthDialogOpen(true)}
                  triggerContent={
                    <Button
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <SaveIcon className="h-4 w-4" />
                      Save palette
                    </Button>
                  }
                />
              )}
            </div>
          )}
          
          {!isLoading && !user && (
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
          
          {!isLoading && user ? (
            <UserProfileDropdown
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
            />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className="flex-shrink-0"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
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
            onColorChange={handleColorChange}
          />
          <PaletteControls />
        </div>
      </main>
    </div>
  );
}