'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { X, LogIn, UserPlus, ArrowRight } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
  title?: string;
  message?: string;
  actionText?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
  title = "Sign in to continue",
  message = "You need to be signed in to access this feature. Would you like to sign in now?",
  actionText = "Sign In"
}) => {
  const router = useRouter();

  const handleSignIn = () => {
    // Store current location for redirect after signin
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_location', window.location.pathname + window.location.search);
    }
    onSignIn();
    onClose();
  };

  const handleSignUp = () => {
    // Store current location for redirect after signup
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_location', window.location.pathname + window.location.search);
    }
    router.push('/auth');
    onClose();
  };

  const handleContinueWithoutSignIn = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <LogIn className="w-5 h-5" />
              {actionText}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-lg transition-colors duration-200"
            >
              <UserPlus className="w-5 h-5" />
              Create Account
            </button>

            <button
              onClick={handleContinueWithoutSignIn}
              className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
