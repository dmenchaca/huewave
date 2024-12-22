import React from 'react';
import { Moon, Settings2, LogOut } from 'lucide-react';
import { Button } from '../../common/Button';
import { useTheme } from '../../../hooks/useTheme';
import { useAuthStore } from '../../../store/authStore';

interface AuthenticatedMenuProps {
  onClose: () => void;
  onManageAccount: () => void;
}

export const AuthenticatedMenu: React.FC<AuthenticatedMenuProps> = ({
  onClose,
  onManageAccount,
}) => {
  const { signOut } = useAuthStore();
  const { isDark, setIsDark } = useTheme();

  return (
    <div className="space-y-2">
      <Button
        onClick={onManageAccount}
        variant="secondary"
        className="w-full flex items-center justify-start px-6 py-3 rounded-none border-0 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Settings2 className="mr-2 h-4 w-4 shrink-0" />
        <span>Manage Account</span>
      </Button>

      <Button
        onClick={() => setIsDark(!isDark)}
        variant="secondary"
        className="w-full flex items-center justify-start px-6 py-3 rounded-none border-0 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <Moon className="mr-2 h-4 w-4 shrink-0" />
        <span>Dark Mode</span>
      </Button>

      <div className="pt-2 border-t dark:border-gray-700">
        <Button
          onClick={signOut}
          variant="secondary"
          className="w-full flex items-center justify-start px-6 py-3 rounded-none border-0 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <LogOut className="mr-2 h-4 w-4 shrink-0" />
          <span>Log out</span>
        </Button>
      </div>
    </div>
  );
};