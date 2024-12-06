import { Button } from "@/components/ui/button";
import { UndoIcon, RedoIcon } from "lucide-react";
import { useColorPalette } from "@/hooks/use-color-palette";

export default function PaletteControls() {
  const { undo, redo, canUndo, canRedo } = useColorPalette();

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant="outline"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        title="Undo last change"
      >
        <UndoIcon className="h-4 w-4" />
      </Button>
      <div className="text-sm text-muted-foreground">
        Press spacebar to generate a new palette
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        title="Redo last change"
      >
        <RedoIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}
