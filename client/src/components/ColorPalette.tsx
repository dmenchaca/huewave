import { LockIcon, UnlockIcon, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ColorPaletteProps {
  colors: string[];
  lockedColors: boolean[];
  onToggleLock: (index: number) => void;
  onColorChange?: (index: number, color: string) => void;
}

export default function ColorPalette({ 
  colors, 
  lockedColors, 
  onToggleLock,
  onColorChange 
}: ColorPaletteProps) {
  const { toast } = useToast();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

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

  const getContrastColor = (hexColor: string): string => {
    const rgb = parseInt(hexColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const handleColorChange = (index: number, value: string) => {
    if (!value.startsWith('#')) {
      value = '#' + value;
    }
    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      onColorChange?.(index, value);
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

          <div 
            className="flex flex-col items-center gap-2"
            style={{ color: getContrastColor(color) }}
          >
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => handleColorChange(index, e.target.value)}
              onFocus={() => setEditingIndex(index)}
              onBlur={() => setEditingIndex(null)}
              className="bg-transparent text-lg font-mono text-center uppercase w-24 focus:outline-none"
              style={{
                color: getContrastColor(color),
                caretColor: getContrastColor(color)
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
