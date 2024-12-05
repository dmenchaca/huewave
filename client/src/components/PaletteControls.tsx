import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import SavePaletteDialog from "./SavePaletteDialog";
import { useUser } from "../hooks/use-user";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

interface PaletteControlsProps {
  onGenerate: () => void;
  colors: string[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  selectedPalette?: Palette | null;
}

export default function PaletteControls({ 
  onGenerate, 
  colors, 
  isDialogOpen, 
  onDialogOpenChange,
  selectedPalette
}: PaletteControlsProps) {
  const { user } = useUser();

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Button
        size="lg"
        onClick={onGenerate}
        className="flex items-center gap-2"
      >
        <RefreshCwIcon className="h-4 w-4" />
        Generate New Palette
      </Button>

      {user ? (
        <SavePaletteDialog 
          colors={colors} 
          isOpen={isDialogOpen}
          onOpenChange={onDialogOpenChange}
          selectedPalette={selectedPalette}
        />
      ) : (
        <Button variant="outline" asChild className="flex items-center gap-2">
          <a href="/auth">
            Login to Save Palette
          </a>
        </Button>
      )}

      <div className="w-full text-center text-sm text-muted-foreground">
        Press spacebar to generate a new palette
      </div>
    </div>
  );
}
