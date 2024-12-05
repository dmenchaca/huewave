import { useState } from "react";
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
  onSaveSuccess?: (palette: Palette) => void;
}

export default function SavePaletteDialog({ 
  colors, 
  isOpen, 
  onOpenChange,
  selectedPalette 
}: SavePaletteDialogProps) {
  const [name, setName] = useState(selectedPalette?.name || "");
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
      onSaveSuccess?.(palette);
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

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for your palette",
      });
      return;
    }

    savePaletteMutation.mutate({ name, colors });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <SaveIcon className="h-4 w-4" />
          {selectedPalette ? 'Update Palette' : 'Save Palette'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{selectedPalette ? 'Update Palette' : 'Save Palette'}</DialogTitle>
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
