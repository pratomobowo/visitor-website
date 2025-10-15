import { NextResponse } from 'next/server';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function POST() {
  try {
    // Create response that clears the auth token cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear the auth token cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}