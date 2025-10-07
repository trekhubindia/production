'use client';

import { useEffect } from 'react';

// Performance monitoring component
export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development or when explicitly enabled
    if (process.env.NODE_ENV !== 'development' && !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR) {
      return;
    }

    // Monitor Core Web Vitals
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const { name, value } = entry as any;
        
        // Log performance metrics
        console.log(`Performance Metric - ${name}:`, {
          value: Math.round(value),
          rating: getRating(name, value),
          timestamp: new Date().toISOString()
        });

        // Send to analytics if needed
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'web_vitals', {
            name,
            value: Math.round(value),
            custom_parameter: getRating(name, value)
          });
        }
      });
    });

    // Observe Core Web Vitals
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch (e) {
      // Fallback for browsers that don't support all entry types
      console.warn('Performance Observer not fully supported');
    }

    // Monitor resource loading times
    const resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 1000) { // Log slow resources (>1s)
          console.warn('Slow Resource:', {
            name: entry.name,
            duration: Math.round(entry.duration),
            type: (entry as any).initiatorType
          });
        }
      });
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource Performance Observer not supported');
    }

    return () => {
      observer.disconnect();
      resourceObserver.disconnect();
    };
  }, []);

  return null; // This component doesn't render anything
}

// Helper function to rate performance metrics
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    'largest-contentful-paint': [2500, 4000],
    'first-input-delay': [100, 300],
    'cumulative-layout-shift': [0.1, 0.25],
    'first-contentful-paint': [1800, 3000],
    'time-to-first-byte': [800, 1800]
  };

  const [good, poor] = thresholds[name] || [0, Infinity];
  
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}
