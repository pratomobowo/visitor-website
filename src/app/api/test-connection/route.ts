import { NextResponse } from 'next/server';
import { testConnection, query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Test basic connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to PostgreSQL database',
        details: 'Check your database connection settings'
      }, { status: 500 });
    }
    
    // Test table existence
    const tables = ['websites', 'visitors', 'daily_stats', 'users'];
    const tableStatus: Record<string, { exists: boolean, error: string | null }> = {};
    
    for (const table of tables) {
      try {
        await query(`SELECT 1 FROM ${table} LIMIT 1`);
        tableStatus[table] = {
          exists: true,
          error: null
        };
      } catch (err) {
        tableStatus[table] = {
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to PostgreSQL database',
      tables: tableStatus,
      env: {
        postgresHost: process.env.POSTGRES_HOST ? 'Set' : 'Not set',
        postgresPort: process.env.POSTGRES_PORT || '5432',
        postgresDb: process.env.POSTGRES_DB || 'visitor_counter',
        postgresUser: process.env.POSTGRES_USER || 'visitor',
        jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      env: {
        postgresHost: process.env.POSTGRES_HOST ? 'Set' : 'Not set',
        postgresPort: process.env.POSTGRES_PORT || '5432',
        postgresDb: process.env.POSTGRES_DB || 'visitor_counter',
        postgresUser: process.env.POSTGRES_USER || 'visitor',
        jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
      }
    }, { status: 500 });
  }
}