import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserFromToken } from './lib/auth';

// Force Node.js runtime for middleware
export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Get token from cookies
  const token = req.cookies.get('auth-token')?.value;
  
  // Check if user is authenticated
  let user = null;
  if (token) {
    user = await getUserFromToken(token);
  }

  // Redirect to login if accessing dashboard without authentication
  if (!user && pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing root with authentication
  if (user && pathname === '/') {
    const redirectUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Add user info to headers for API routes
  if (user && pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/', '/api/:path*'],
};