import { NextRequest, NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/postgres';
import { requireAdmin, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// Admin-only: Test database connection
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!isUser(authResult)) return authResult;

    const isConnected = await testConnection();

    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to PostgreSQL database',
      }, { status: 500 });
    }

    // Test table existence
    const tables = ['websites', 'visitors', 'daily_stats', 'users'];
    const tableStatus: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        tableStatus[table] = true;
      } catch {
        tableStatus[table] = false;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database connection OK',
      tables: tableStatus,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
