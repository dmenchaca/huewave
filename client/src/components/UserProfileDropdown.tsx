import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2Icon, LogOutIcon, MoonIcon, SunIcon } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import ManageAccountDialog from "./ManageAccountDialog";

interface UserProfileDropdownProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function UserProfileDropdown({ darkMode, toggleDarkMode }: UserProfileDropdownProps) {
  const { user, logout } = useUser();
  const [isManageAccountOpen, setIsManageAccountOpen] = useState(false);

  if (!user) return null;

  // Generate initials from email
  const initials = user.email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="relative h-9 w-9 rounded-full bg-primary text-primary-foreground font-medium rounded-[8px]"
          >
            {initials}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.email}</p>
              <p className="text-xs leading-none text-muted-foreground">
                Account Settings
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setIsManageAccountOpen(true)}>
              <Settings2Icon className="mr-2 h-4 w-4" />
              <span>Manage Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleDarkMode}>
              {darkMode ? (
                <>
                  <SunIcon className="mr-2 h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <MoonIcon className="mr-2 h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}>
            <LogOutIcon className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageAccountDialog
        isOpen={isManageAccountOpen}
        onOpenChange={setIsManageAccountOpen}
      />
    </>
  );
}