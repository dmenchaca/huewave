import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ProfileTab } from './tabs/ProfileTab';
import { SecurityTab } from './tabs/SecurityTab';
import { DangerZone } from './DangerZone';

interface AccountTabsProps {
  onClose: () => void;
}

export const AccountTabs: React.FC<AccountTabsProps> = ({ onClose }) => {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="space-y-4">
        <ProfileTab />
      </TabsContent>
      
      <TabsContent value="security" className="space-y-4">
        <SecurityTab />
      </TabsContent>

      <div className="mt-6 pt-6 border-t">
        <DangerZone onClose={onClose} />
      </div>
    </Tabs>
  );
};