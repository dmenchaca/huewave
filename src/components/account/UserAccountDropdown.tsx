import React, { useState } from 'react';
import { Settings2, Moon, LogOut } from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';
import { useAuthStore } from '../../store/authStore';
import { AccountSettingsDialog } from './AccountSettingsDialog';
import { useTheme } from '../../hooks/useTheme';
import { UserInfo } from './UserInfo';
import { UserActions } from './UserActions';
import { UserAvatar } from './UserAvatar';

export const UserAccountDropdown: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { isDark, setIsDark } = useTheme();

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full">
            <UserAvatar email={user.email || ''} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content className="w-56">
          <UserInfo email={user.email} />
          <DropdownMenu.Separator />
          <UserActions 
            onManageAccount={() => setIsSettingsOpen(true)}
            onToggleTheme={() => setIsDark(!isDark)}
            onSignOut={signOut}
          />
        </DropdownMenu.Content>
      </DropdownMenu>

      <AccountSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};