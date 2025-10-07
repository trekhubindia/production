import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define redirect mappings
const redirects: Record<string, string> = {
  '/login': '/auth',
  '/register': '/auth',
  '/signup': '/auth',
  '/signin': '/auth',
  '/profile': '/dashboard',
  '/account': '/dashboard',
  '/my-bookings': '/dashboard/bookings',
  '/my-wishlist': '/dashboard/wishlist',
  '/booking-history': '/dashboard/bookings',
  '/user-profile': '/dashboard/settings',
  '/user-settings': '/dashboard/settings',
  '/my-account': '/dashboard',
  '/user-dashboard': '/dashboard',
  '/member': '/dashboard',
  '/member-area': '/dashboard',
  '/customer': '/dashboard',
  '/customer-portal': '/dashboard',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle simple redirects
  if (redirects[pathname]) {
    const redirectUrl = new URL(redirects[pathname], request.url);
    return NextResponse.redirect(redirectUrl, 301); // Permanent redirect
  }

  // Handle trailing slashes (remove them except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    const redirectUrl = new URL(pathname.slice(0, -1), request.url);
    return NextResponse.redirect(redirectUrl, 301);
  }

  // Handle case-insensitive redirects for common patterns
  const lowerPathname = pathname.toLowerCase();
  if (lowerPathname !== pathname) {
    // Check if the lowercase version should be redirected
    if (redirects[lowerPathname]) {
      const redirectUrl = new URL(redirects[lowerPathname], request.url);
      return NextResponse.redirect(redirectUrl, 301);
    }
  }

  // Continue with the request
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|icons|robots.txt|sitemap.xml).*)',
  ],
};
