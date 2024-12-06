import { Button } from "@/components/ui/button";
import { useUser } from "../hooks/use-user";

export default function PaletteControls() {
  const { user } = useUser();

  return (
    <div className="text-center text-sm text-muted-foreground">
      {!user && (
        <Button variant="outline" asChild className="mb-4 flex items-center gap-2">
          <a href="/auth">
            Login to Save Palette
          </a>
        </Button>
      )}
      Press spacebar to generate a new palette
    </div>
  );
}
