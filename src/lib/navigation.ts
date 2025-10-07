import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

// Navigation tracking utilities
export class NavigationTracker {
  private static readonly CURRENT_PATH_KEY = 'currentPath';
  private static readonly PREVIOUS_PATH_KEY = 'previousPath';
  private static readonly NAVIGATION_HISTORY_KEY = 'navigationHistory';

  static updatePath(newPath: string): void {
    if (typeof window === 'undefined') return;

    try {
      const currentStored = sessionStorage.getItem(this.CURRENT_PATH_KEY);
      const history = this.getHistory();

      // If we have a current path stored, move it to previous
      if (currentStored && currentStored !== newPath) {
        sessionStorage.setItem(this.PREVIOUS_PATH_KEY, currentStored);
        
        // Add to history (keep last 10 entries)
        history.unshift(currentStored);
        if (history.length > 10) {
          history.pop();
        }
        sessionStorage.setItem(this.NAVIGATION_HISTORY_KEY, JSON.stringify(history));
      }

      // Store the current path
      sessionStorage.setItem(this.CURRENT_PATH_KEY, newPath);
    } catch (error) {
      console.warn('Navigation tracking failed:', error);
    }
  }

  static getPreviousPath(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.PREVIOUS_PATH_KEY);
  }

  static getHistory(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = sessionStorage.getItem(this.NAVIGATION_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.CURRENT_PATH_KEY);
    sessionStorage.removeItem(this.PREVIOUS_PATH_KEY);
    sessionStorage.removeItem(this.NAVIGATION_HISTORY_KEY);
  }
}

// Smart navigation utilities
export class SmartNavigation {
  static getParentPath(currentPath: string): string {
    // Policy pages
    if (['/privacy-policy', '/terms-of-service', '/cancellation-policy'].includes(currentPath)) {
      return '/';
    }

    // Trek pages
    if (currentPath.startsWith('/treks/') || currentPath.startsWith('/book/')) {
      return '/treks';
    }

    // Blog pages
    if (currentPath.startsWith('/blogs/')) {
      return '/blogs';
    }

    // Dashboard pages
    if (currentPath.startsWith('/dashboard/')) {
      return '/dashboard';
    }

    // Admin pages
    if (currentPath.startsWith('/admin/')) {
      return '/admin';
    }

    // Auth pages
    if (currentPath.startsWith('/auth/')) {
      return '/auth';
    }

    // Booking pages
    if (currentPath.startsWith('/booking/') || currentPath.startsWith('/checkout')) {
      return '/';
    }

    // Default to home
    return '/';
  }

  static navigateBack(router: AppRouterInstance, currentPath: string, fallbackUrl: string = '/'): void {
    const previousPath = NavigationTracker.getPreviousPath();
    
    if (previousPath && previousPath !== currentPath) {
      // Avoid infinite loops and external URLs
      if (this.isValidInternalPath(previousPath)) {
        router.push(previousPath);
        return;
      }
    }

    // Use smart parent path as fallback
    const parentPath = this.getParentPath(currentPath);
    router.push(parentPath !== currentPath ? parentPath : fallbackUrl);
  }

  static navigateToParent(router: AppRouterInstance, currentPath: string): void {
    const parentPath = this.getParentPath(currentPath);
    router.push(parentPath);
  }

  static navigateWithTracking(router: AppRouterInstance, path: string): void {
    NavigationTracker.updatePath(path);
    router.push(path);
  }

  private static isValidInternalPath(path: string): boolean {
    // Check if path is internal and safe
    return path.startsWith('/') && 
           !path.includes('..') && 
           !path.startsWith('//') &&
           path.length < 500; // Reasonable length limit
  }
}

// Route configuration for redirects and navigation
export const RouteConfig = {
  // Protected routes that require authentication
  protectedRoutes: [
    '/dashboard',
    '/admin',
    '/booking',
    '/checkout'
  ],

  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/treks',
    '/blogs',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
    '/cancellation-policy',
    '/auth'
  ],

  // Routes that should redirect if user is already authenticated
  authRoutes: [
    '/auth',
    '/auth/forgot-password',
    '/reset-password'
  ],

  // Admin-only routes
  adminRoutes: [
    '/admin'
  ],

  // Default redirects
  redirects: {
    '/login': '/auth',
    '/register': '/auth',
    '/signup': '/auth',
    '/signin': '/auth',
    '/profile': '/dashboard',
    '/account': '/dashboard',
    '/my-bookings': '/dashboard/bookings',
    '/my-wishlist': '/dashboard/wishlist'
  }
};

// Redirect utilities
export class RedirectManager {
  static shouldRedirect(path: string): string | null {
    return RouteConfig.redirects[path as keyof typeof RouteConfig.redirects] || null;
  }

  static isProtectedRoute(path: string): boolean {
    return RouteConfig.protectedRoutes.some(route => path.startsWith(route));
  }

  static isAuthRoute(path: string): boolean {
    return RouteConfig.authRoutes.some(route => path.startsWith(route));
  }

  static isAdminRoute(path: string): boolean {
    return RouteConfig.adminRoutes.some(route => path.startsWith(route));
  }

  static getLoginRedirect(intendedPath: string): string {
    // Store intended path for post-login redirect
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('loginRedirect', intendedPath);
    }
    return '/auth';
  }

  static getPostLoginRedirect(): string {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('loginRedirect');
      if (stored) {
        sessionStorage.removeItem('loginRedirect');
        return stored;
      }
    }
    return '/dashboard';
  }
}

 