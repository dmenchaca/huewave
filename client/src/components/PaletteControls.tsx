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
  colors: string[];
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  selectedPalette?: Palette | null;
  onSavePalette: (palette: Palette) => void;
}

export default function PaletteControls({ 
  colors, 
  isDialogOpen, 
  onDialogOpenChange,
  selectedPalette,
  onSavePalette
}: PaletteControlsProps) {
  const { user } = useUser();

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {!user && (
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
