import { Button } from "@/components/ui/button";
import { useUser } from "../hooks/use-user";

export default function PaletteControls() {
  const { user } = useUser();

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      {!user && (
        <Button variant="outline" asChild className="flex items-center gap-2">
          <a href="/auth">
            Login to Save Palette
          </a>
        </Button>
      )}

      <div className="w-full text-center text-sm text-muted-foreground">
        Press spacebar to generate a new palette
      </div>
    </div>
  );
}
