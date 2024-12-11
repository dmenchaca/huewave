
import { Button } from "@/components/ui/button";
import { useColorPalette } from "../hooks/use-color-palette";
import { RefreshCwIcon } from "lucide-react";

export default function PaletteControls() {
  const { generateNewPalette } = useColorPalette();

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex justify-center gap-4">
      <Button
        size="lg"
        className="rounded-full px-8"
        onClick={generateNewPalette}
      >
        <RefreshCwIcon className="mr-2 h-4 w-4" />
        Generate New Palette
      </Button>
    </div>
  );
}
