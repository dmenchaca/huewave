import React from 'react';
import { Moon } from 'lucide-react';
import { Button } from '../../common/Button';
import { useTheme } from '../../../hooks/useTheme';

interface GuestMenuProps {
  onClose: () => void;
}

export const GuestMenu: React.FC<GuestMenuProps> = ({ onClose }) => {
  const { isDark, setIsDark } = useTheme();

  return (
    <div className="space-y-2">
      <Button
        onClick={() => setIsDark(!isDark)}
        variant="secondary"
        className="w-full flex items-center justify-start px-6 py-3 rounded-none border-0 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Moon className="mr-2 h-4 w-4 shrink-0" />
        <span>Dark Mode</span>
      </Button>
    </div>
  );
};