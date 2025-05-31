import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get tokens from localStorage is not available in middleware
  // We'll handle auth protection in the components instead
  
  // Redirect /dashboard to appropriate dashboard based on stored user role
  if (request.nextUrl.pathname === '/dashboard') {
    // Default redirect to user dashboard - role-based routing handled in component
    return NextResponse.redirect(new URL('/dashboard/user', request.url));
  }

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