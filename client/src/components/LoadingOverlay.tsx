import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  fullScreen?: boolean;
}

export default function LoadingOverlay({ fullScreen = false }: LoadingOverlayProps) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50"
    : "flex items-center justify-center p-4";

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
