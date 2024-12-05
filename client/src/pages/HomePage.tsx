import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "lucide-react";
import ColorPalette from "../components/ColorPalette";
import PaletteControls from "../components/PaletteControls";
import UserPalettes from "../components/UserPalettes";
import { useColorPalette } from "../hooks/use-color-palette";
import { useUser } from "../hooks/use-user";

export default function HomePage() {
  const { user, logout } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { 
    colors,
    generateNewPalette,
    lockedColors,
    toggleLock,
    darkMode,
    toggleDarkMode 
  } = useColorPalette({ isDialogOpen });

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
        <h1 className="text-2xl font-bold">Color Palette Generator</h1>
        <div className="flex items-center gap-4">
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
          
          <PaletteControls 
            onGenerate={generateNewPalette}
            colors={colors}
            isDialogOpen={isDialogOpen}
            onDialogOpenChange={setIsDialogOpen}
          />

          {user && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Saved Palettes</h2>
              <UserPalettes />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
