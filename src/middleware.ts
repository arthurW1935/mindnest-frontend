import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const storedUser = request.cookies.get('mindnest_user')?.value;
  const path = request.nextUrl.pathname;

  // If no user is logged in, redirect to login
  if (!storedUser) {
    if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    return NextResponse.next();
  }

  try {
    const user = JSON.parse(storedUser);

    // Admin routes
    if (path.startsWith('/admin')) {
      if (user.role !== 'admin') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      return NextResponse.next();
    }

    // Therapist routes
    if (path.startsWith('/dashboard/therapist')) {
      if (user.role !== 'psychiatrist') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      return NextResponse.next();
    }

    // User-specific routes
    if (path.startsWith('/dashboard/user') || 
        path.startsWith('/dashboard/find-therapists') ||
        path.startsWith('/dashboard/appointments') ||
        path.startsWith('/dashboard/profile') ||
        path.startsWith('/dashboard/settings')) {
      if (user.role !== 'user') {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
      return NextResponse.next();
    }

    // General dashboard route - redirect to appropriate dashboard
    if (path === '/dashboard' || path === '/dashboard/') {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (user.role === 'psychiatrist') {
        return NextResponse.redirect(new URL('/dashboard/therapist', request.url));
      } else if (user.role === 'user') {
        return NextResponse.redirect(new URL('/dashboard/user', request.url));
      }
    }

    // If user is logged in and tries to access login/register, redirect to their dashboard
    if (path.startsWith('/auth')) {
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else if (user.role === 'psychiatrist') {
        return NextResponse.redirect(new URL('/dashboard/therapist', request.url));
      } else if (user.role === 'user') {
        return NextResponse.redirect(new URL('/dashboard/user', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    // If there's an error parsing the user data, clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/auth/login', request.url));
    response.cookies.delete('mindnest_user');
    response.cookies.delete('mindnest_tokens');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
};