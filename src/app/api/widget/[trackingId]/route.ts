import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

interface Website {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  try {
    const { trackingId } = await params;
    
    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }
    
    // Get website by tracking ID
    const website = await queryOne<Website>(
      'SELECT * FROM websites WHERE tracking_id = $1 AND is_active = true',
      [trackingId]
    );
    
    if (!website) {
      return NextResponse.json(
        { error: 'Invalid or inactive tracking ID' },
        { status: 404 }
      );
    }
    
    const websiteId = website.id;
    
    // Calculate date ranges
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = todayStart;
    
    // Get online visitors (last 30 minutes)
    const onlineResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT session_id) as count
       FROM visitors
       WHERE website_id = $1
       AND visit_time >= NOW() - INTERVAL '30 minutes'`,
      [websiteId]
    );
    const onlineVisitors = parseInt(onlineResult[0]?.count || '0', 10);
    
    // Get today's unique visitors
    const todayResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT session_id) as count
       FROM visitors
       WHERE website_id = $1
       AND visit_time >= $2`,
      [websiteId, todayStart.toISOString()]
    );
    const todayVisitors = parseInt(todayResult[0]?.count || '0', 10);
    
    // Get yesterday's unique visitors
    const yesterdayResult = await query<{ count: string }>(
      `SELECT COUNT(DISTINCT session_id) as count
       FROM visitors
       WHERE website_id = $1
       AND visit_time >= $2
       AND visit_time < $3`,
      [websiteId, yesterdayStart.toISOString(), yesterdayEnd.toISOString()]
    );
    const yesterdayVisitors = parseInt(yesterdayResult[0]?.count || '0', 10);
    
    const responseData = {
      websiteName: website.name,
      onlineVisitors,
      todayVisitors,
      yesterdayVisitors,
      timestamp: now.toISOString()
    };
    
    return NextResponse.json(responseData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // Cache for 60 seconds
      },
    });
    
  } catch (error) {
    console.error('Error in widget API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
