import React from 'react';
import { Settings2, Moon, LogOut } from 'lucide-react';
import { DropdownMenu } from '../ui/DropdownMenu';

interface UserActionsProps {
  onManageAccount: () => void;
  onToggleTheme: () => void;
  onSignOut: () => void;
}

export const UserActions: React.FC<UserActionsProps> = ({
  onManageAccount,
  onToggleTheme,
  onSignOut,
}) => (
  <>
    <DropdownMenu.Group>
      <DropdownMenu.Item onClick={onManageAccount}>
        <Settings2 className="mr-2 h-4 w-4" />
        <span>Manage Account</span>
      </DropdownMenu.Item>
      
      <DropdownMenu.Item onClick={onToggleTheme}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark Mode</span>
      </DropdownMenu.Item>
    </DropdownMenu.Group>

    <DropdownMenu.Separator />

    <DropdownMenu.Item onClick={onSignOut}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </DropdownMenu.Item>
  </>
);