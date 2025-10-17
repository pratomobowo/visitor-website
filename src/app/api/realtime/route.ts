import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    
    if (!websiteId) {
      // Get total realtime visitors across all websites
      const realTimeVisitors = await query(`
        SELECT COUNT(DISTINCT session_id) as count
        FROM visitors
        WHERE visit_time >= NOW() - INTERVAL '30 minutes'
      `);
      
      const count = (realTimeVisitors[0] as { count: string })?.count || 0;
      console.log('DEBUG: Total realtime visitors (all websites):', count);
      return NextResponse.json({ count });
    }
    
    // Get realtime visitors for specific website
    const realTimeVisitors = await query(`
      SELECT COUNT(DISTINCT session_id) as count
      FROM visitors
      WHERE website_id = $1
      AND visit_time >= NOW() - INTERVAL '30 minutes'
    `, [websiteId]);
    
    const count = (realTimeVisitors[0] as { count: string })?.count || 0;
    console.log('DEBUG: Realtime visitors for website', websiteId, ':', count);
    return NextResponse.json({ count });
    
  } catch (error) {
    console.error('Error in realtime API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}