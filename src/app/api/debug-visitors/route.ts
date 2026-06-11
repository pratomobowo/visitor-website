import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAdmin, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// Admin-only debug endpoint
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!isUser(authResult)) return authResult;

    const totalVisitors = await query('SELECT COUNT(*) as count FROM visitors');
    const websites = await query('SELECT id, name, domain, tracking_id, is_active FROM websites');

    const recentVisitors = await query(`
      SELECT v.id, v.session_id, v.page_url, v.visit_time, v.browser, v.device_type, w.name as website_name
      FROM visitors v
      JOIN websites w ON v.website_id = w.id
      WHERE v.visit_time >= NOW() - INTERVAL '24 hours'
      ORDER BY v.visit_time DESC
      LIMIT 10
    `);

    return NextResponse.json({
      totalVisitors: (totalVisitors[0] as { count: string })?.count || 0,
      totalWebsites: websites?.length || 0,
      recentVisitors: recentVisitors || [],
      websites: websites || []
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
