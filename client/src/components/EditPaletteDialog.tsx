import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditIcon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

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
  const [name, setName] = useState(palette.name);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(palette.name);
    }
  }, [isOpen, palette.name]);

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

    editPaletteMutation.mutate({ name, colors: palette.colors });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Palette</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="Palette name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex h-10 gap-2">
            {palette.colors.map((color, index) => (
              <div
                key={index}
                className="flex-1 rounded"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button onClick={handleSave} disabled={editPaletteMutation.isPending}>
            {editPaletteMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
