
import React, { useEffect, useState } from 'react';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function ShortcutGuideToast() {
  const [shouldShow, setShouldShow] = useState(false);
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('dismissed_shortcut_toast');
    if (!hasSeenGuide) {
      setShouldShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('dismissed_shortcut_toast', 'true');
    setShouldShow(false);
  };

  useEffect(() => {
    if (shouldShow) {
      toast({
        duration: Infinity,
        className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-bottom",
        content: (
          <div className="grid grid-cols-[1fr_auto] gap-4 items-center w-full">
            <div>
              <div className="text-sm font-semibold">Keyboard Shortcuts</div>
              <div className="text-sm opacity-90 leading-relaxed">
                Press <span className="bg-muted px-2 py-1 rounded mx-1">space</span> to generate color palettes. 
                Undo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Z' : 'Ctrl + Z'}</span> and 
                redo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span>.
              </div>
            </div>
            <Button 
              variant="secondary" 
              size="default" 
              className="rounded-lg"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
        )
      });
    }
  }, [shouldShow, isMac]);

  return null;
}
