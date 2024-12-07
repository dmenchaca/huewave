import { Button } from "@/components/ui/button";
import { RefreshCwIcon } from "lucide-react";
import { useColorPalette } from "@/hooks/use-color-palette";

export default function PaletteControls() {
  const { generateNewPalette } = useColorPalette();

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={generateNewPalette}
        className="flex items-center gap-2"
        size="lg"
      >
        <RefreshCwIcon className="h-5 w-5" />
        Generate New Palette
      </Button>
      <div className="text-center text-sm text-muted-foreground">
        Press spacebar or click the button above to generate a new palette
      </div>
    </div>
  );
}
