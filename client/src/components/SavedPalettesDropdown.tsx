import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderIcon, SearchIcon } from "lucide-react";
import { useColorPalette } from "@/hooks/use-color-palette";

interface Palette {
  id: number;
  name: string;
  colors: string[];
  created_at: string;
}

interface SavedPalettesDropdownProps {
  onPaletteSelect?: (palette: Palette) => void;
  selectedPalette?: Palette | null;
}

export default function SavedPalettesDropdown({ 
  onPaletteSelect,
  selectedPalette 
}: SavedPalettesDropdownProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { generateNewPalette } = useColorPalette();

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

  const filteredPalettes = palettes?.filter(palette =>
    palette.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FolderIcon className="h-4 w-4" />
          {selectedPalette ? selectedPalette.name : "Saved Palettes"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuLabel>Saved Palettes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search palettes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : filteredPalettes?.length === 0 ? (
          <DropdownMenuItem disabled>
            {searchQuery ? "No matching palettes" : "No saved palettes"}
          </DropdownMenuItem>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            {filteredPalettes?.map((palette) => (
              <DropdownMenuItem 
                key={palette.id} 
                className="flex flex-col items-start cursor-pointer"
                onClick={() => onPaletteSelect?.(palette)}
              >
                <span className="font-medium">
                  {palette.name}
                  {selectedPalette?.id === palette.id && " (Selected)"}
                </span>
                <div className="flex w-full gap-1 h-4 mt-1 rounded-sm overflow-hidden">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="flex-1"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
