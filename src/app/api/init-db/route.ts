import { NextRequest, NextResponse } from 'next/server';
import { initializeDatabase } from '@/lib/init-db';
import { requireAdmin, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// Admin-only: Initialize database
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!isUser(authResult)) return authResult;

    await initializeDatabase();
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Database initialization failed:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database' },
      { status: 500 }
    );
  }
}

// Remove GET method — init should not happen on GET requests
