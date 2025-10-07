'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { pageview, GA_TRACKING_ID } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize Google Analytics
    const initGA = () => {
      if (typeof window !== 'undefined') {
        // Ensure gtag is available
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        window.gtag = gtag;

        // Configure Google Analytics with proper settings
        gtag('js', new Date());
        gtag('config', GA_TRACKING_ID, {
          page_title: document.title,
          page_location: window.location.href,
          send_page_view: true,
          cookie_domain: window.location.hostname.includes('localhost') ? 'none' : 'auto',
          cookie_flags: 'SameSite=Lax;Secure',
          // Enhanced measurement
          enhanced_measurement: true,
          // Debug mode in development
          debug_mode: process.env.NODE_ENV === 'development'
        });

        // Send initial page view
        gtag('event', 'page_view', {
          page_title: document.title,
          page_location: window.location.href,
          page_path: window.location.pathname
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('Google Analytics initialized:', GA_TRACKING_ID);
        }
      }
    };

    // Load GA script and initialize
    const loadGA = () => {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`;
      script.onload = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Google Analytics script loaded');
        }
        initGA();
      };
      script.onerror = () => console.error('❌ Failed to load Google Analytics script');
      document.head.appendChild(script);
    };

    // Check if script is already loaded
    const existingScript = document.querySelector(`script[src*="gtag/js?id=${GA_TRACKING_ID}"]`);
    if (!existingScript) {
      loadGA();
    } else {
      initGA();
    }
  }, []);

  useEffect(() => {
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      pageview(url);
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}
