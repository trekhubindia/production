// Performance optimization utilities for smooth homepage experience

// Debounce function to reduce excessive function calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function for scroll events
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Preload critical images
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Preload multiple images
export async function preloadImages(srcs: string[]): Promise<void> {
  try {
    await Promise.all(srcs.map(preloadImage));
  } catch (error) {
    console.warn('Some images failed to preload:', error);
  }
}

// Request idle callback polyfill
export function requestIdleCallback(
  callback: () => void,
  options: { timeout?: number } = {}
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return typeof window !== 'undefined' ? (window as any).setTimeout(callback, 1) : 0;
}

// Cancel idle callback
export function cancelIdleCallback(id: number): void {
  if (typeof window !== 'undefined') {
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(id);
    } else {
      (window as any).clearTimeout(id);
    }
  }
}

// Smooth scroll to element
export function smoothScrollTo(
  element: HTMLElement,
  options: ScrollIntoViewOptions = {}
): void {
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options,
  };

  element.scrollIntoView(defaultOptions);
}

// Check if element is in viewport
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Optimize animations based on device performance
export function getOptimizedAnimationSettings(): {
  reducedMotion: boolean;
  animationDuration: number;
  particleCount: number;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      reducedMotion: false,
      animationDuration: 600,
      particleCount: 10,
    };
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isLowEndDevice = navigator.hardwareConcurrency <= 2;
  const isSlowConnection = 'connection' in navigator && 
    (navigator as any).connection?.effectiveType === 'slow-2g';

  return {
    reducedMotion: prefersReducedMotion,
    animationDuration: prefersReducedMotion || isLowEndDevice ? 0 : isSlowConnection ? 300 : 600,
    particleCount: prefersReducedMotion ? 0 : isLowEndDevice ? 5 : isSlowConnection ? 10 : 15,
  };
}

// Memory cleanup for components
export function cleanupResources(cleanupFunctions: (() => void)[]): void {
  cleanupFunctions.forEach(cleanup => {
    try {
      cleanup();
    } catch (error) {
      console.warn('Cleanup function failed:', error);
    }
  });
}

// Batch DOM updates
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFrame(() => {
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        console.warn('DOM update failed:', error);
      }
    });
  });
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Get device performance tier
export function getDevicePerformanceTier(): 'high' | 'medium' | 'low' {
  if (typeof navigator === 'undefined') return 'medium';
  
  const cores = navigator.hardwareConcurrency || 1;
  const memory = (navigator as any).deviceMemory || 1;
  
  if (cores >= 8 && memory >= 8) return 'high';
  if (cores >= 4 && memory >= 4) return 'medium';
  return 'low';
}

// Optimize component rendering based on performance
export function shouldRenderComponent(
  componentName: string,
  performanceTier: 'high' | 'medium' | 'low' = getDevicePerformanceTier()
): boolean {
  const heavyComponents = ['ParticleBackground', 'ComplexAnimations', 'VideoBackground'];
  
  if (performanceTier === 'low' && heavyComponents.includes(componentName)) {
    return false;
  }
  
  return true;
}
