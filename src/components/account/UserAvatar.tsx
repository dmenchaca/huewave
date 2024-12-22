import React from 'react';
import { cn } from '../../lib/utils';

interface UserAvatarProps {
  email: string;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ email, className }) => {
  // Get first letter of email and convert to uppercase
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className={cn(
      "w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium",
      "bg-white border border-gray-300 text-gray-700",
      "hover:bg-gray-50 transition-colors",
      "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700",
      className
    )}>
      {initial}
    </div>
  );
};