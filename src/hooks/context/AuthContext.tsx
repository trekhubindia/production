'use client';

import React, { createContext, useContext, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { SmartNavigation } from '@/lib/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  location?: string;
  website?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  refreshing: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const fetcher = (url: string) => fetch(url).then(res => res.json());

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data, error, mutate } = useSWR('/api/auth/session', fetcher, { 
    dedupingInterval: 10000, // Reduced from 30000 to 10000 (10 seconds)
    refreshInterval: 60000, // Check every minute
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const user = data?.user || null;
  const loading = !data && !error;
  const initialized = !!data || !!error;
  const [refreshing, setRefreshing] = React.useState(false);
  const router = useRouter();

  // Auto-refresh session before expiration
  useEffect(() => {
    if (!user) return;

    // Don't auto-refresh on admin pages to avoid conflicts
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/admin')) {
        console.log('Skipping auto-refresh on admin page:', pathname);
        return;
      }
    }

    const checkSessionExpiry = async () => {
      // Check if session is about to expire (within 5 minutes)
      const now = new Date();
      const sessionExpiry = new Date(data?.session?.expires_at || 0);
      const timeUntilExpiry = sessionExpiry.getTime() - now.getTime();
      
      // If session expires in less than 5 minutes, refresh it
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        console.log('Session expiring soon, refreshing...');
        setRefreshing(true);
        try {
          const response = await fetch('/api/auth/refresh', { method: 'POST' });
          if (response.ok) {
            // Refresh the session data
            mutate('/api/auth/session');
          } else {
            console.error('Failed to refresh session');
          }
        } catch (error) {
          console.error('Error refreshing session:', error);
        } finally {
          setRefreshing(false);
        }
      }
    };

    // Check every 2 minutes
    const interval = setInterval(checkSessionExpiry, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [user, data?.session?.expires_at, mutate]);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // Get last location from storage, default to home
        const lastLocation = typeof window !== 'undefined' ? localStorage.getItem('last_location') || '/' : '/';
        
        // Clear the stored location
        if (typeof window !== 'undefined') {
          localStorage.removeItem('last_location');
        }
        
        // Redirect to the last location for instant feedback
        router.replace(lastLocation);
        // Refresh session in the background
        mutate('/api/auth/session');
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (response.ok) {
        // After successful signup, sign in the user
        // The signIn function will handle the redirect to last_location
        return await signIn(email, password);
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      
      // Clear local state
      await mutate('/api/auth/session');
      
      // The API now redirects, but we can also redirect client-side for immediate feedback
      SmartNavigation.navigateWithTracking(router, '/');
    } catch (error) {
      console.error('Logout error:', error);
      // Even on error, redirect to homepage
      SmartNavigation.navigateWithTracking(router, '/');
    }
  };

  const value = {
    user,
    loading,
    initialized,
    refreshing,
    signIn,
    signUp,
    signOut: logout,
    refreshSession: async () => mutate('/api/auth/session'),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 