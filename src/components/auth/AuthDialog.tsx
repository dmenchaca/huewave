import React from 'react';
import { Dialog } from '../ui/dialog';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { AuthToggle } from './AuthToggle';
import { isSupabaseConfigured } from '../../lib/supabase';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: 'login' | 'signup' | 'forgot-password';
}

export const AuthDialog: React.FC<AuthDialogProps> = ({ 
  isOpen, 
  onClose, 
  defaultView = 'login' 
}) => {
  const [view, setView] = React.useState(defaultView);

  const getTitle = () => {
    switch (view) {
      case 'signup':
        return 'Create Account';
      case 'forgot-password':
        return isSupabaseConfigured ? 'Reset Password' : 'Demo Mode';
      case 'forgot-password':
        return 'Reset Password';
      default:
        return 'Welcome Back';
    }
  };

  const getDescription = () => {
    switch (view) {
      case 'signup':
        return 'Sign up to start saving your color palettes';
      case 'forgot-password':
        return isSupabaseConfigured 
          ? 'Enter your email to receive a password reset link'
          : 'This is a demo version. Connect Supabase to enable password reset.';
      case 'forgot-password':
        return 'Enter your email to receive a password reset link';
      default:
        return 'Sign in to save and manage your palettes';
    }
  };

  return (
    <Dialog.Root dialogId="auth-dialog" open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>{getTitle()}</Dialog.Title>
          <Dialog.Description>{getDescription()}</Dialog.Description>
        </Dialog.Header>

        {view === 'login' && (
          <>
            <LoginForm 
              onSuccess={onClose} 
              onForgotPassword={() => setView('forgot-password')}
            />
            <AuthToggle 
              view={view} 
              onToggle={() => setView('signup')} 
            />
          </>
        )}

        {view === 'signup' && (
          <>
            <SignUpForm onSuccess={onClose} />
            <AuthToggle 
              view={view} 
              onToggle={() => setView('login')} 
            />
          </>
        )}

        {view === 'forgot-password' && isSupabaseConfigured ? (
          <>
            <ForgotPasswordForm />
            <div className="mt-4 text-center">
              <button
                onClick={() => setView('login')}
                className="text-sm font-medium text-blue-500 hover:text-blue-600"
              >
                Back to login
              </button>
            </div>
          </>
        ) : view === 'forgot-password' && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              This is a demo version running without Supabase configuration. 
              Your data will be stored locally in your browser.
            </p>
            <button
              onClick={() => setView('login')}
              className="text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              Back to login
            </button>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
};