import React from 'react';
import { Menu } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { Button } from '../common/Button';
import { useAuthStore } from '../../store/authStore';
import { useState } from 'react';
import { MobileMenu } from './MobileMenu';

interface MobileHeaderProps {
  onOpenMenu: () => void;
  onOpenSave: () => void;
  onOpenAuth: () => void;
  backgroundColor?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  onOpenMenu,
  onOpenSave,
  onOpenAuth,
  backgroundColor = '#ffffff'
}) => {
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <>
      <div className="h-14 flex items-center justify-between w-full px-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <Logo backgroundColor={backgroundColor} />
        <div className="flex items-center gap-2 overflow-visible">
          {!user && (
            <Button
              onClick={onOpenAuth}
              variant="secondary"
              className="text-sm"
            >
              Sign in
            </Button>
          )}
          <Button
            onClick={() => setShowMenu(true)}
            variant="secondary"
            className="p-2"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <MobileMenu 
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        onManageAccount={() => {
          setShowMenu(false);
          // Add account management logic here
        }}
      />
    </>
  );
}