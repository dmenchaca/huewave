
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LockIcon, UnlockIcon, CheckIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColorPaletteProps {
  colors: string[];
  lockedColors?: boolean[];
  onToggleLock?: (index: number) => void;
  onColorChange?: (index: number, color: string) => void;
  generateNewPalette?: () => void;
}

export default function ColorPalette({ 
  colors, 
  lockedColors = [],
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
    if (target.classList.contains('color-area-background') && generateNewPalette) {
      generateNewPalette();
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
            onClick={(e) => handleColorClick(e, index)}
          />
          
          <div className="absolute top-4 right-4 flex gap-2">
            {onToggleLock && (
              <Button
                variant="secondary"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLock(index);
                }}
              >
                {lockedColors[index] ? (
                  <LockIcon className="h-4 w-4" />
                ) : (
                  <UnlockIcon className="h-4 w-4" />
                )}
              </Button>
            )}
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
                <span className="font-mono text-sm">{color}</span>
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
