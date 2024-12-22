import { useEffect } from 'react';
import { toast } from 'sonner';

export const useToast = (message: string) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      toast(message, {
        position: 'bottom-center',
        className: 'slide-up-toast'
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [message]);
};