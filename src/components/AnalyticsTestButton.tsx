'use client';

import { useState } from 'react';
import { trackTrekView, trackSearchQuery, trackContactForm } from '@/lib/gtag';

export default function AnalyticsTestButton() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const runTests = () => {
    const results: string[] = [];
    
    try {
      // Test 1: Basic gtag availability
      if (typeof window !== 'undefined' && window.gtag) {
        results.push('✅ gtag function available');
        
        // Test 2: Send test event
        window.gtag('event', 'test_event', {
          event_category: 'testing',
          event_label: 'Manual Test',
          value: 1
        });
        results.push('✅ Test event sent');
        
        // Test 3: Track trek view
        trackTrekView('Test Trek', 'test-trek');
        results.push('✅ Trek view tracked');
        
        // Test 4: Track search
        trackSearchQuery('test search', 5);
        results.push('✅ Search query tracked');
        
        // Test 5: Track contact form
        trackContactForm('test form');
        results.push('✅ Contact form tracked');
        
        // Test 6: Check dataLayer
        if (window.dataLayer && window.dataLayer.length > 0) {
          results.push(`✅ DataLayer has ${window.dataLayer.length} events`);
        } else {
          results.push('❌ DataLayer empty or missing');
        }
        
      } else {
        results.push('❌ gtag function not available');
      }
    } catch (error) {
      results.push(`❌ Error: ${error}`);
    }
    
    setTestResults(results);
    
    // Log to console for debugging
    console.log('🧪 Analytics Test Results:', results);
    if (typeof window !== 'undefined' && window.dataLayer) {
      console.log('📊 Current DataLayer:', window.dataLayer);
    }
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 bg-blue-600 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
      <div className="font-bold mb-2">Analytics Tester</div>
      <button 
        onClick={runTests}
        className="bg-white text-blue-600 px-3 py-1 rounded text-xs font-semibold mb-2 hover:bg-gray-100"
      >
        Run Tests
      </button>
      {testResults.length > 0 && (
        <div className="text-xs">
          {testResults.map((result, index) => (
            <div key={index} className="mb-1">{result}</div>
          ))}
        </div>
      )}
    </div>
  );
}
