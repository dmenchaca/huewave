import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditIcon, RefreshCwIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ColorPalette from "./ColorPalette";
import { useColorPalette } from "../hooks/use-color-palette";

interface EditPaletteDialogProps {
  palette: {
    id: number;
    name: string;
    colors: string[];
  };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditPaletteDialog({ 
  palette,
  isOpen, 
  onOpenChange 
}: EditPaletteDialogProps) {
  // Separate state for name to prevent color updates
  const [name, setName] = useState(palette.name);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const {
    colors,
    generateNewPalette,
    lockedColors,
    toggleLock,
  } = useColorPalette({ 
    isDialogOpen: isOpen,
    initialColors: palette.colors 
  });

  // Reset name when dialog opens or palette changes
  useEffect(() => {
    setName(palette.name);
  }, [palette.name]);

  const editPaletteMutation = useMutation({
    mutationFn: async (data: { name: string; colors: string[] }) => {
      const response = await fetch(`/api/palettes/${palette.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["palettes"] });
      toast({
        title: "Success",
        description: "Palette updated successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for your palette",
      });
      return;
    }

    editPaletteMutation.mutate({ name, colors });
  };

  // Handle spacebar only when dialog is open
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && isOpen) {
        // Check if the target is an input element
        if (e.target instanceof HTMLInputElement) {
          return; // Don't generate new colors when input is focused
        }
        e.preventDefault();
        e.stopPropagation();
        generateNewPalette();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyPress, true);
      return () => window.removeEventListener("keydown", handleKeyPress, true);
    }
  }, [generateNewPalette, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-3xl focus:outline-none"
        style={{ outline: 'none' }}
      >
        <DialogHeader>
          <DialogTitle>Edit Palette</DialogTitle>
          <DialogDescription>
            Modify your palette colors and name. Press spacebar to generate new colors or lock individual colors to keep them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Palette name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <ColorPalette 
            colors={colors}
            lockedColors={lockedColors}
            onToggleLock={toggleLock}
          />
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={generateNewPalette}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className="h-4 w-4" />
              Generate New Colors
            </Button>
            <Button onClick={handleSave} disabled={editPaletteMutation.isPending}>
              {editPaletteMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground text-center">
            Press spacebar to generate new colors
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
