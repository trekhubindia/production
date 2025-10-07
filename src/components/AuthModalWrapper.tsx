'use client';

import React, { createContext, useContext, useState } from 'react';

interface AuthModalContextType {
  showAuthModal: boolean;
  authMode: 'signin' | 'signup';
  openAuthModal: (mode: 'signin' | 'signup') => void;
  closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider');
  }
  return context;
};

export const AuthModalWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const openAuthModal = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  return (
    <AuthModalContext.Provider value={{
      showAuthModal,
      authMode,
      openAuthModal,
      closeAuthModal,
    }}>
      {children}
      {/* AuthModal component removed */}
    </AuthModalContext.Provider>
  );
}; 