import React from 'react';
import { Dialog } from '../components/ui/dialog';
import { ResetPasswordForm } from '../components/auth/ResetPasswordForm';

export const ResetPasswordPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mx-4">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Reset Password</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Enter your new password below</p>
          <ResetPasswordForm />
        </div>
      </div>
    </div>
  );
}