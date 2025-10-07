'use client';

import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';

interface Props {
  children: React.ReactNode;
  enabled?: boolean;
}

export default function LenisProvider({ children, enabled = true }: Props) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Lenis] disabled via prop');
      }
      return;
    }

    // Respect OS-level reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('[Lenis] not initialized due to prefers-reduced-motion');
      }
      return;
    }

    const lenis = new Lenis({
      // Tune these as you wish
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      // Enable touch synchronization so smoothness is visible on touch devices
      syncTouch: true,
      // Reasonable multipliers to make the effect noticeable
      wheelMultiplier: 1,
      touchMultiplier: 1,
      // Explicit targets to avoid event attachment issues
      wheelEventsTarget: window,
      eventsTarget: window,
      // wheelMultiplier: 1,
    });
    lenisRef.current = lenis;

    // Diagnostics to confirm Lenis initialization at runtime
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[Lenis] initialized', { isSmooth: lenis.isSmooth });
      const onScroll = ({ scroll, limit }: any) => {
        // eslint-disable-next-line no-console
        console.log('[Lenis] scroll', { scroll, limit });
      };
      lenis.on('scroll', onScroll);
      // store listener for cleanup via ref
      (lenis as any).__onScroll = onScroll;
    }

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    // Allow programmatic scroll restoration
    if ('scrollRestoration' in history) {
      try { (history as any).scrollRestoration = 'manual'; } catch {}
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (process.env.NODE_ENV !== 'production') {
        try {
          // remove dev listener
          const l: any = lenisRef.current;
          if (l && l.__onScroll) l.off('scroll', l.__onScroll);
        } catch {}
        // eslint-disable-next-line no-console
        console.log('[Lenis] destroyed');
      }
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [enabled]);

  return <>{children}</>;
}
