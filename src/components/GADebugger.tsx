'use client';

import { useEffect, useState } from 'react';
import { GA_TRACKING_ID } from '@/lib/gtag';

export default function GADebugger() {
  const [gaStatus, setGaStatus] = useState<string>('Checking...');
  const [dataLayerStatus, setDataLayerStatus] = useState<string>('Checking...');

  useEffect(() => {
    const checkGA = () => {
      if (typeof window !== 'undefined') {
        // Check if gtag script is loaded
        const gaScript = document.querySelector(`script[src*="gtag/js?id=${GA_TRACKING_ID}"]`);
        if (gaScript) {
          setGaStatus('✅ GA Script Loaded');
        } else {
          setGaStatus('❌ GA Script Not Found');
        }

        // Check if dataLayer exists
        if (window.dataLayer && window.dataLayer.length > 0) {
          setDataLayerStatus(`✅ DataLayer Active (${window.dataLayer.length} events)`);
        } else {
          setDataLayerStatus('❌ DataLayer Not Found');
        }

        // Check if gtag function exists
        if (window.gtag) {
          console.log('✅ gtag function available');
        } else {
          console.log('❌ gtag function not available');
        }
      }
    };

    // Check immediately and then every 2 seconds
    checkGA();
    const interval = setInterval(checkGA, 2000);

    return () => clearInterval(interval);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">GA Debug ({GA_TRACKING_ID})</div>
      <div>{gaStatus}</div>
      <div>{dataLayerStatus}</div>
      <div className="mt-2 text-gray-300">
        URL: {typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
      </div>
    </div>
  );
}
