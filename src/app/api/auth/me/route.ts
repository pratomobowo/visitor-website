import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('Auth /me API called');
    
    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value;
    console.log('Token found:', !!token);
    
    if (!token) {
      console.log('No authentication token found in cookies');
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }
    
    console.log('Verifying token...');
    const user = await getUserFromToken(token);
    console.log('User from token:', !!user);
    
    if (!user) {
      console.log('Invalid or expired token');
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        last_login: user.last_login,
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user information' },
      { status: 500 }
    );
  }
}