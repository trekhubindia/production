import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  if (pathname.startsWith('/admin')) {
    const sessionId = request.cookies.get('auth_session')?.value;

    if (!sessionId) {
      // No session, redirect to auth
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    // For admin routes, let the layout handle authentication checks
    return NextResponse.next();
  }



  // For all other routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 