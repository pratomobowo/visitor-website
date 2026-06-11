import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// Rate limit: 5 login attempts per minute per IP
const LOGIN_RATE_LIMIT = { maxRequests: 5, windowSeconds: 60 };

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for brute-force protection
    const clientIP = getClientIP(request.headers);
    const rateLimitResult = checkRateLimit(`login:${clientIP}`, LOGIN_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.resetIn.toString(),
          }
        }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const authUser = await loginUser({ email, password });

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: authUser.id,
        email: authUser.email,
        name: authUser.name,
        role: authUser.role,
      }
    });

    // Set token in HTTP-only cookie
    response.cookies.set('auth-token', authUser.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}
