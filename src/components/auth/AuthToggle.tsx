import React from 'react';

interface AuthToggleProps {
  view: 'login' | 'signup';
  onToggle: () => void;
}

export const AuthToggle: React.FC<AuthToggleProps> = ({ view, onToggle }) => (
  <div className="mt-4 text-center">
    <button
      onClick={onToggle}
      className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
    >
      {view === 'login' 
        ? "Don't have an account? Sign up" 
        : 'Already have an account? Log in'}
    </button>
  </div>
);