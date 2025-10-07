'use client';

import { useState } from 'react';

export default function TestDBPage() {
  const [debugData, setDebugData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const testDatabase = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/treks/debug');
      const data = await res.json();
      setDebugData(data);
    } catch (error) {
      console.error('Test failed:', error);
      setDebugData({ error: 'Test failed', message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Database Connection Test</h1>
      
      <button 
        onClick={testDatabase}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 mb-4"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </button>

      {debugData && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Debug Results:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 