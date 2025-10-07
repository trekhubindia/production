'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/context/AuthContext';
import { AuthPromptModal } from './AuthPromptModal';

interface AuthRequiredButtonProps {
  children: React.ReactNode;
  href: string;
  className?: string;
  onClick?: () => void;
  showSignInPrompt?: boolean;
  promptTitle?: string;
  promptMessage?: string;
  promptActionText?: string;
}

export default function AuthRequiredButton({ 
  children, 
  href, 
  className = '',
  onClick,
  showSignInPrompt = true,
  promptTitle = "Sign in to continue",
  promptMessage = "You need to be signed in to access this feature. Would you like to sign in now?",
  promptActionText = "Sign In"
}: AuthRequiredButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (loading) {
      return; // Don't do anything while loading
    }

    if (!user) {
      if (showSignInPrompt) {
        // Store current location before showing popup
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('last_location', currentPath);
        setShowAuthPrompt(true);
      } else {
        // Store the current URL to redirect back after login
        localStorage.setItem('last_location', href);
        router.push('/auth');
      }
      return;
    }

    // User is authenticated, proceed with the action
    if (onClick) {
      onClick();
    } else {
      router.push(href);
    }
  };

  const handleSignIn = () => {
    // Store the current URL to redirect back after login
    const currentPath = window.location.pathname + window.location.search;
    localStorage.setItem('last_location', currentPath);
    router.push('/auth');
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={className}
        disabled={loading}
      >
        {children}
      </button>
      
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
