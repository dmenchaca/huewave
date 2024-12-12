
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
          <div className="grid gap-2 leading-relaxed">
            <p className="text-sm">
              Press <span className="bg-muted px-2 py-1 rounded mx-1">space</span> to generate color palettes. 
              Undo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Z' : 'Ctrl + Z'}</span> and 
              redo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span>
            </p>
            <Button 
              variant="secondary" 
              className="w-full rounded-[12px] mt-2"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
        ),
        duration: null,
        className: "fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-[500px] rounded-[12px]",
        hideCloseButton: true,
      });
    }
  }, [shouldShow, toast, isMac]);

  return null;
}
