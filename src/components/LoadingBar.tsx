'use client';

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface LoadingBarContextType {
  start: () => void;
  done: () => void;
}

const LoadingBarContext = createContext<LoadingBarContextType | undefined>(undefined);

export function LoadingBarProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setLoading(true);
    setProgress(10);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setProgress((old) => (old < 90 ? old + Math.random() * 10 : old));
    }, 200);
  }, []);

  const done = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
      if (timer.current) clearInterval(timer.current);
    }, 200);
  }, []);

  return (
    <LoadingBarContext.Provider value={{ start, done }}>
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          zIndex: 9999,
          background: 'transparent',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: '#0070f3',
            transition: 'width 0.2s ease',
          }} />
        </div>
      )}
      {children}
    </LoadingBarContext.Provider>
  );
}

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext);
  if (!ctx) throw new Error('useLoadingBar must be used within LoadingBarProvider');
  return ctx;
} 