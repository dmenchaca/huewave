
import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ShortcutGuideToast() {
  const [shouldShow, setShouldShow] = useState(false);
  const { toast } = useToast();
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
        title: "Keyboard Shortcuts",
        description: (
          <div className="grid grid-cols-2 gap-4 items-center w-full">
            <div>
              <p className="text-sm leading-relaxed">
                Press <span className="bg-muted px-2 py-1 rounded mx-1">space</span> to generate color palettes. 
                Undo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Z' : 'Ctrl + Z'}</span> and 
                redo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span>
              </p>
            </div>
            <div className="flex justify-end">
              <Button 
                variant="secondary" 
                className="rounded-lg"
                onClick={handleDismiss}
              >
                Got it
              </Button>
            </div>
          </div>
        ),
        duration: null,
        className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-[500px] rounded-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        hideCloseButton: true as const,
      });
    }
  }, [shouldShow, toast, isMac]);

  return null;
}
