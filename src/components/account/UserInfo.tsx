import React from 'react';

interface UserInfoProps {
  email: string;
}

export const UserInfo: React.FC<UserInfoProps> = ({ email }) => (
  <div className="px-2 py-1.5 text-sm font-normal">
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">{email}</p>
      <p className="text-xs leading-none text-gray-500 dark:text-gray-400">Account Settings</p>
    </div>
  </div>
);