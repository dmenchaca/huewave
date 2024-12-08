import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { 
  UserIcon, 
  Settings2Icon, 
  LogOutIcon, 
  SunIcon, 
  MoonIcon,
  PaletteIcon,
  UserCircleIcon,
  KeyIcon,
  BellIcon
} from "lucide-react";
import { useUser } from "../hooks/use-user";
import { useColorPalette } from "../hooks/use-color-palette";
import ManageAccountDialog from "./ManageAccountDialog";
import { useToast } from "../hooks/use-toast";

export default function UserProfileDropdown() {
  const { user, logout } = useUser();
  const { darkMode, toggleDarkMode } = useColorPalette();
  const [showManageAccount, setShowManageAccount] = useState(false);
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileClick = () => {
    setShowManageAccount(true);
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2 relative">
            <UserCircleIcon className="h-5 w-5" />
            <span className="hidden md:inline truncate max-w-[150px]">{user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Account ID: {user.id}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={handleProfileClick}
            >
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
            >
              <PaletteIcon className="h-4 w-4" />
              <span>My Palettes</span>
              <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
            >
              <KeyIcon className="h-4 w-4" />
              <span>Security Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
            >
              <BellIcon className="h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={() => setShowManageAccount(true)}
            >
              <Settings2Icon className="h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer" 
              onClick={toggleDarkMode}
            >
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
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center gap-2 cursor-pointer text-red-500 focus:text-red-500" 
            onClick={handleLogout}
          >
            <LogOutIcon className="h-4 w-4" />
            <span>Log Out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
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
