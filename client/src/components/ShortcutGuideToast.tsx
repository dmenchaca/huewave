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
    toast.dismiss();
  };

  useEffect(() => {
    if (shouldShow) {
      const timer = setTimeout(() => {
        toast({
          variant: "shortcut",
          title: "Keyboard Shortcuts",
          duration: Infinity,
          description: (
            <div className="grid grid-cols-[1fr_auto] gap-4 items-center w-full">
              <p className="text-sm leading-relaxed">
                Press <span className="bg-muted px-2 py-1 rounded mx-1">space</span> to generate color palettes. 
                Undo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Z' : 'Ctrl + Z'}</span> and 
                redo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span>
              </p>
              <Button 
                variant="secondary" 
                className="whitespace-nowrap"
                onClick={handleDismiss}
              >
                Got it
              </Button>
            </div>
          ),
          className: "rounded-lg shadow-lg motion-safe:transform-gpu",
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldShow, toast, isMac]);

  return null;
}