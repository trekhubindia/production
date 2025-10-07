'use client';

import { MenuProvider } from '@/hooks/context/MenuContext';
import { AuthProvider } from '@/hooks/context/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { AuthModalWrapper } from '@/components/AuthModalWrapper';
import ClientOfflineIndicator from '@/components/ClientOfflineIndicator';
import { LoadingBarProvider } from '@/components/LoadingBar';
import { useAuth } from '@/hooks/context/AuthContext';

function SessionLoadingOverlay() {
  const { initialized } = useAuth();
  if (initialized) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#00e676',
            borderRadius: '50%',
            animation: 'bounce 1.4s ease-in-out infinite both',
          }} />
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#00e676',
            borderRadius: '50%',
            animation: 'bounce 1.4s ease-in-out infinite both',
            animationDelay: '0.16s',
          }} />
          <div style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#00e676',
        borderRadius: '50%',
            animation: 'bounce 1.4s ease-in-out infinite both',
            animationDelay: '0.32s',
      }} />
        </div>
        <div style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: '500',
        }}>
          Loading...
        </div>
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1.0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <LoadingBarProvider>
        <ClientOfflineIndicator />
        <AuthProvider>
          <SessionLoadingOverlay />
          <AuthModalWrapper>
            <WishlistProvider>
              <MenuProvider>
                {children}
              </MenuProvider>
            </WishlistProvider>
          </AuthModalWrapper>
        </AuthProvider>
      </LoadingBarProvider>
    </ThemeProvider>
  );
}