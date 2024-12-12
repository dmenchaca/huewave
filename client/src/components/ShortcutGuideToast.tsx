
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Press <span className="bg-muted px-2 py-1 rounded mx-1">space</span> to generate color palettes. 
              Undo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Z' : 'Ctrl + Z'}</span> and 
              redo with <span className="bg-muted px-2 py-1 rounded mx-1">{isMac ? 'Cmd + Shift + Z' : 'Ctrl + Y'}</span>
            </p>
            <Button 
              variant="secondary" 
              className="w-full rounded-[8px]"
              onClick={handleDismiss}
            >
              Got it
            </Button>
          </div>
        ),
        duration: 10000,
      });
    }
  }, [shouldShow, toast, isMac]);

  return null;
}
