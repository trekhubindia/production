import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useRouter } from 'next/navigation';

export const useOAuthRedirect = () => {
  const { refreshSession, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if we're on any page and there might be an OAuth redirect
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get('error');
      const authSuccess = urlParams.get('auth_success');

      // If OAuth was successful, refresh the session
      if (authSuccess === 'true' && initialized) {
        refreshSession();
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Redirect to last location if available
        const lastLocation = localStorage.getItem('last_location');
        if (lastLocation && lastLocation !== '/') {
          localStorage.removeItem('last_location');
          router.push(lastLocation);
        }
      }

      // If there was an error, we can handle it here
      if (error) {
        console.error('OAuth error:', error);
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [refreshSession, initialized, router]);
}; 