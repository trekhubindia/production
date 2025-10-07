import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
// Remove all code related to usePWA, fallback to always online state or remove the component if not used.

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = React.useState(false);
  const [showReconnected, setShowReconnected] = React.useState(false);

  React.useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    updateOnlineStatus(); // Set initial value

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  React.useEffect(() => {
    if (!isOffline) {
      // Show reconnected message when coming back online
      setShowReconnected(true);
      
      // Hide the message after 3 seconds
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // Hide reconnected message when going offline
      setShowReconnected(false);
    }
  }, [isOffline]);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed md:top-16 top-0 left-0 right-0 z-40 bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium md:rounded-b-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            You&apos;re offline. Some features may be limited.
          </div>
        </motion.div>
      )}
      
      {showReconnected && !isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed md:top-16 top-0 left-0 right-0 z-40 bg-green-500 text-green-900 px-4 py-2 text-center text-sm font-medium md:rounded-b-lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Wifi className="h-4 w-4" />
            You&apos;re back online!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}