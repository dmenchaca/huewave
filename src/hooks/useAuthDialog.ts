import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuthDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return {
    isOpen,
    open,
    close,
    user
  };
};