'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { AuthPromptModal } from './AuthPromptModal';

interface AuthRequiredProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
  showPrompt?: boolean;
  promptTitle?: string;
  promptMessage?: string;
  promptActionText?: string;
}

export default function AuthRequired({ 
  children, 
  redirectTo = '/auth',
  fallback,
  showPrompt = true,
  promptTitle = "Sign in to continue",
  promptMessage = "You need to be signed in to access this feature. Would you like to sign in now?",
  promptActionText = "Sign In"
}: AuthRequiredProps) {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (initialized && !loading && !user) {
      if (showPrompt) {
        // Store current location before showing popup
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('last_location', currentPath);
        // Show popup instead of redirecting
        setShowAuthPrompt(true);
      } else {
        // Fallback to redirect behavior
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('last_location', currentPath);
        router.push(redirectTo);
      }
    }
  }, [user, loading, initialized, router, redirectTo, showPrompt]);

  const handleSignIn = () => {
    // Store the current URL to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('last_location', currentPath);
    router.push(redirectTo);
  };

  // Show loading state while checking authentication
  if (loading || !initialized) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show prompt or fallback
  if (!user) {
    return (
      <>
        {fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
            </div>
          </div>
        )}
        
        <AuthPromptModal
          isOpen={showAuthPrompt}
          onClose={() => setShowAuthPrompt(false)}
          onSignIn={handleSignIn}
          title={promptTitle}
          message={promptMessage}
          actionText={promptActionText}
        />
      </>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
