import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

export default function UserPalettes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: palettes, isLoading } = useQuery<Palette[]>({
    queryKey: ["palettes"],
    queryFn: async () => {
      const response = await fetch("/api/palettes");
      if (!response.ok) {
        throw new Error("Failed to fetch palettes");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/palettes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete palette");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["palettes"] });
      toast({
        title: "Success",
        description: "Palette deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return <div>Loading palettes...</div>;
  }

  return (
    <ScrollArea className="h-[300px] rounded-md border p-4">
      <div className="grid gap-4">
        {palettes?.map((palette) => (
          <div
            key={palette.id}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{palette.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate(palette.id)}
                disabled={deleteMutation.isPending}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex h-8 gap-1 rounded-md overflow-hidden">
              {palette.colors.map((color, index) => (
                <div
                  key={index}
                  className="flex-1"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Created: {new Date(palette.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
