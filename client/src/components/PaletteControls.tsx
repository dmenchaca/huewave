import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UndoIcon, RedoIcon } from "lucide-react";
import { useColorPalette } from "@/hooks/use-color-palette";

export default function PaletteControls() {
  const { undo, redo, canUndo, canRedo } = useColorPalette();
  
  const handleUndo = useCallback(() => {
    if (canUndo) undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) redo();
  }, [canRedo, redo]);

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handleUndo}
        disabled={!canUndo}
        title="Undo last change (Ctrl+Z)"
      >
        <UndoIcon className="h-4 w-4" />
      </Button>
      <div className="text-sm text-muted-foreground">
        Press spacebar to generate a new palette
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleRedo}
        disabled={!canRedo}
        title="Redo last change (Ctrl+Y)"
      >
        <RedoIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
