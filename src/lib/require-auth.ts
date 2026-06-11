import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken, User } from './auth';

/**
 * Helper to check authentication from request cookies.
 * Returns the user if authenticated, or a NextResponse error if not.
 */
export async function requireAuth(request: NextRequest): Promise<User | NextResponse> {
  const token = request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const user = await getUserFromToken(token);

  if (!user) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Helper to check authentication AND admin role.
 */
export async function requireAdmin(request: NextRequest): Promise<User | NextResponse> {
  const result = await requireAuth(request);

  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== 'admin') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return result;
}

/**
 * Type guard to check if the result is a User (not an error response).
 */
export function isUser(result: User | NextResponse): result is User {
  return !(result instanceof NextResponse);
}
