import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SaveIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "../hooks/use-user";
import { generatePaletteName } from "@/lib/color-utils";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

interface SavePaletteDialogProps {
  colors: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPalette?: Palette | null;
  onSaveSuccess: (palette: Palette) => void;
  onSaveAttempt?: () => void;
  defaultName?: string;
}

export default function SavePaletteDialog({ 
  colors, 
  isOpen, 
  onOpenChange,
  selectedPalette,
  onSaveSuccess,
  onSaveAttempt
}: SavePaletteDialogProps) {
  const { user } = useUser();
  const [name, setName] = useState(selectedPalette?.name || generatePaletteName(colors));
  
  useEffect(() => {
    if (selectedPalette) {
      setName(selectedPalette.name);
    } else {
      setName(generatePaletteName(colors));
    }
  }, [selectedPalette, colors]);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const savePaletteMutation = useMutation({
    mutationFn: async (data: { name: string; colors: string[] }) => {
      const url = selectedPalette 
        ? `/api/palettes/${selectedPalette.id}`
        : "/api/palettes";
      
      const response = await fetch(url, {
        method: selectedPalette ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      return response.json();
    },
    onSuccess: (palette: Palette) => {
      queryClient.invalidateQueries({ queryKey: ["palettes"] });
      toast({
        title: "Success",
        description: selectedPalette ? "Palette updated successfully" : "Palette saved successfully",
      });
      onSaveSuccess(palette);
      onOpenChange(false);
      setName("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for your palette",
      });
      return;
    }

    if (!user) {
      // Store palette data in session
      try {
        console.log('Storing palette before login:', { name, colors });
        const response = await fetch('/api/store-palette', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, colors })
        });
        
        if (!response.ok) {
          console.error('Failed to store palette:', await response.text());
          throw new Error('Failed to store palette');
        }

        console.log('Successfully stored palette in session');
        toast({
          title: "Palette stored",
          description: "Please log in to save your palette permanently",
        });
        onSaveAttempt?.();
        onOpenChange(false); // Close the save dialog
      } catch (error) {
        console.error('Error storing palette:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to store palette",
        });
      }
      return;
    }

    savePaletteMutation.mutate({ name, colors });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <SaveIcon className="h-4 w-4" />
          {selectedPalette ? 'Update' : 'Save palette'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedPalette ? 'Update palette' : 'Save palette'}</DialogTitle>
          <DialogDescription>
            {selectedPalette 
              ? 'Update the name or colors of your existing palette'
              : 'Give your palette a name to save it to your collection'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Palette name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex h-10 gap-2">
            {colors.map((color, index) => (
              <div
                key={index}
                className="flex-1 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button onClick={handleSave} disabled={savePaletteMutation.isPending}>
            {savePaletteMutation.isPending ? "Saving..." : (selectedPalette ? "Update" : "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
