import React, { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AuthDialog from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon, SaveIcon, Trash2Icon } from "lucide-react";
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
  // Initialize all hooks at the top level in the same order
  const { user, logout, isLoading, isFetching } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaveAsNewDialogOpen, setIsSaveAsNewDialogOpen] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
  
  const paletteConfig = useColorPalette({
    isDialogOpen,
    initialColors: selectedPalette?.colors
  });

  const {
    colors,
    setColors,
    lockedColors,
    darkMode,
    toggleLock,
    toggleDarkMode,
    generateNewPalette,
    handleColorChange
  } = paletteConfig;

  // Generate new palette when component mounts (except in test environment)
  useEffect(() => {
    if (!generateNewPalette) return;
    
    // Skip if we're in test environment or if any dialog is open
    if (process.env.NODE_ENV === 'test' || isDialogOpen || isSaveAsNewDialogOpen || isAuthDialogOpen) {
      return;
    }
    
    generateNewPalette();
    
    if (!user) {
      setSelectedPalette(null);
    }
  }, [user, generateNewPalette, isDialogOpen, isSaveAsNewDialogOpen, isAuthDialogOpen]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Skip if there's no generator function
    if (!generateNewPalette) return;

    // Skip if any dialog is open
    if (isDialogOpen || isSaveAsNewDialogOpen || isAuthDialogOpen) return;

    // Skip repeated keypresses
    if (e.repeat) return;

    // Skip if event originated from or is focused on form elements
    const isFormElement = (element: EventTarget | null): boolean => 
      element instanceof HTMLInputElement || 
      element instanceof HTMLTextAreaElement || 
      element instanceof HTMLButtonElement;

    if (isFormElement(e.target) || isFormElement(document.activeElement)) return;

    // Only handle spacebar press
    if (e.code === "Space" && e.type === 'keydown') {
      e.preventDefault();
      e.stopPropagation();
      generateNewPalette();
    }
  }, [generateNewPalette, isDialogOpen, isSaveAsNewDialogOpen, isAuthDialogOpen]);

  // Register keypress listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  const handlePaletteSave = (palette: Palette) => {
    setSelectedPalette(palette);
  };

  return (
    <div className="h-screen bg-background overflow-hidden">
      <header className="mx-auto px-4 py-2 md:h-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-0">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="inline-flex items-center gap-2">
            <img src="/images/huewave-icon.png" alt="HueWave Logo" className="w-8 flex-shrink-0" />
            <h1 className="text-2xl font-extrabold leading-none pb-1">HueWave</h1>
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
                <>
                  <SavePaletteDialog 
                    colors={colors} 
                    isOpen={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    selectedPalette={selectedPalette}
                    onSaveSuccess={handlePaletteSave}
                    triggerContent={
                      <Button variant="default" className="flex items-center gap-2 rounded-[8px]">
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
                      <Button variant="outline" className="flex items-center gap-2 rounded-[8px]">
                        <SaveIcon className="h-4 w-4" />
                        Save as new
                      </Button>
                    }
                  />
                  {selectedPalette && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                          <Trash2Icon className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete palette "{selectedPalette.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your palette "{selectedPalette.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={async () => {
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
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              ) : (
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
                    <Button variant="default" className="flex items-center gap-2 rounded-[8px]">
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
                className="whitespace-nowrap rounded-[8px]"
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
              className="flex-shrink-0 rounded-[8px]"
            >
              {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </header>

      <main className="h-[calc(100vh-4rem)]">
        <div className="grid gap-8 h-full">
          <ColorPalette 
            colors={colors}
            onColorChange={handleColorChange}
            generateNewPalette={generateNewPalette}
          />
          <PaletteControls />
        </div>
      </main>
    </div>
  );
}