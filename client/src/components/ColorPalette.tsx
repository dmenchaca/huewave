import { LockIcon, UnlockIcon, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ColorPaletteProps {
  colors: string[];
  lockedColors: boolean[];
  onToggleLock: (index: number) => void;
}

export default function ColorPalette({ 
  colors, 
  lockedColors, 
  onToggleLock 
}: ColorPaletteProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (color: string, index: number) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedIndex(index);
      toast({
        title: "Copied!",
        description: `Color ${color} copied to clipboard`,
      });
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Could not copy color to clipboard",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-[50vh] rounded-lg overflow-hidden">
      {colors.map((color, index) => (
        <div
          key={index}
          className="relative group flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onToggleLock(index)}
            >
              {lockedColors[index] ? (
                <LockIcon className="h-4 w-4" />
              ) : (
                <UnlockIcon className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant="secondary"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => copyToClipboard(color, index)}
            >
              {copiedIndex === index ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <span className="text-white text-lg font-mono shadow-sm uppercase">
            {color}
          </span>
        </div>
      ))}
    </div>
  );
}
