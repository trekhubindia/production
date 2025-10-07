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

        // Check if dataLayer exists and has data
        if (window.dataLayer && window.dataLayer.length > 0) {
          const configEvents = window.dataLayer.filter((item: any) => 
            Array.isArray(item) && item[0] === 'config'
          );
          const pageViewEvents = window.dataLayer.filter((item: any) => 
            Array.isArray(item) && item[0] === 'event' && item[1] === 'page_view'
          );
          
          setDataLayerStatus(`✅ DataLayer Active (${window.dataLayer.length} events, ${configEvents.length} config, ${pageViewEvents.length} pageviews)`);
        } else {
          setDataLayerStatus('❌ DataLayer Not Found or Empty');
        }

        // Check if gtag function exists and test it
        if (window.gtag) {
          console.log('✅ gtag function available');
          // Test gtag function
          try {
            window.gtag('event', 'debug_test', {
              event_category: 'debug',
              event_label: 'GA Debug Test',
              debug_mode: true
            });
            console.log('✅ gtag test event sent successfully');
          } catch (error) {
            console.error('❌ gtag test failed:', error);
          }
        } else {
          console.log('❌ gtag function not available');
        }
      }
    };

    // Check immediately and then every 3 seconds
    checkGA();
    const interval = setInterval(checkGA, 3000);

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
