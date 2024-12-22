import React from 'react';
import { EmailSection } from './sections/EmailSection';
import { PasswordSection } from './sections/PasswordSection';
import { DangerZone } from './DangerZone';

interface AccountSettingsProps {
  onClose: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ onClose }) => {
  return (
    <div className="space-y-6">
      <EmailSection />
      
      <div className="border-t border-gray-200 dark:border-gray-700" />
      
      <PasswordSection />
      
      <div className="border-t border-gray-200 dark:border-gray-700" />
      
      <DangerZone onClose={onClose} />
    </div>
  );
};