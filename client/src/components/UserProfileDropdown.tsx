import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { UserIcon, Settings2Icon, LogOutIcon, SunIcon, MoonIcon } from "lucide-react";
import { useUser } from "../hooks/use-user";
import { useColorPalette } from "../hooks/use-color-palette";
import ManageAccountDialog from "./ManageAccountDialog";

export default function UserProfileDropdown() {
  const { user, logout } = useUser();
  const { darkMode, toggleDarkMode } = useColorPalette();
  const [showManageAccount, setShowManageAccount] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden md:inline">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span>{user.email}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => setShowManageAccount(true)}
          >
            <Settings2Icon className="h-4 w-4" />
            <span>Manage Account</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={toggleDarkMode}>
            {darkMode ? (
              <>
                <SunIcon className="h-4 w-4" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <MoonIcon className="h-4 w-4" />
                <span>Dark Mode</span>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={handleLogout}>
            <LogOutIcon className="h-4 w-4" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageAccountDialog
        isOpen={showManageAccount}
        onOpenChange={setShowManageAccount}
      />
    </>
  );
}
