
import { LockIcon, UnlockIcon, CopyIcon, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ColorPaletteProps {
  colors: string[];
  lockedColors: boolean[];
  onToggleLock: (index: number) => void;
  onColorChange?: (index: number, color: string) => void;
  generateNewPalette?: () => void;
}

export default function ColorPalette({ 
  colors, 
  lockedColors, 
  onToggleLock,
  onColorChange,
  generateNewPalette
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

  const handleColorClick = (e: React.MouseEvent, index: number) => {
    const target = e.target as HTMLElement;
    // Only generate new palette if clicking the background area
    if (target.classList.contains('color-area-background') && generateNewPalette) {
      generateNewPalette();
    }
  };

  const getContrastColor = (hexColor: string): string => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
  };

  const handleColorChange = (index: number, value: string) => {
    onColorChange?.(index, value);
    
    if (value.length >= 7) {
      let hex = value.replace('#', '');
      
      if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
      }
      
      if (!value.startsWith('#')) {
        value = '#' + hex;
      }
      
      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        onColorChange?.(index, value);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-full overflow-hidden">
      {colors.map((color, index) => (
        <div
          key={index}
          className="relative group flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <div 
            className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors color-area-background"
          />
          
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(index);
              }}
              aria-label={lockedColors[index] ? "Unlock color" : "Lock color"}
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
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(color, index);
              }}
            >
              {copiedIndex === index ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                <CopyIcon className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div 
            className="flex flex-col items-center gap-2 relative z-10 min-h-[80px]"
            style={{ color: getContrastColor(color) }}
          >
            <input
              type="text"
              value={color.toUpperCase()}
              onChange={(e) => handleColorChange(index, e.target.value)}
              onClick={(e) => {
                e.stopPropagation();
                if (e.target instanceof HTMLInputElement) {
                  e.target.select();
                  setEditingIndex(index);
                }
              }}
              onBlur={() => {
                setEditingIndex(null);
                if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
                  onColorChange?.(index, '#000000');
                }
              }}
              className="bg-transparent text-lg font-mono text-center uppercase w-24 focus:outline-none cursor-text"
              style={{
                color: getContrastColor(color),
                caretColor: getContrastColor(color),
                backgroundColor: editingIndex === index ? 'rgba(0,0,0,0.1)' : 'transparent'
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
