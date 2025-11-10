import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    // Get recent visitor activities (last 30 minutes)
    const recentActivity = await query(`
      SELECT
        id,
        session_id,
        ip_address,
        user_agent,
        page_url,
        page_title,
        visit_time,
        duration_seconds,
        browser,
        os,
        device_type,
        country
      FROM visitors
      WHERE website_id = $1
      AND visit_time >= NOW() - INTERVAL '30 minutes'
      ORDER BY visit_time DESC
      LIMIT $2
    `, [websiteId, limit]);

    if (!recentActivity || recentActivity.length === 0) {
      return NextResponse.json({
        activities: [],
        count: 0,
      });
    }

    // Format the response
    const activities = (recentActivity as Array<{
      id: string;
      session_id: string;
      ip_address: string;
      user_agent: string;
      page_url: string;
      page_title: string;
      visit_time: string;
      duration_seconds?: number;
      browser: string;
      os: string;
      device_type: string;
      country?: string;
    }>).map((visitor) => ({
      id: visitor.id,
      sessionId: visitor.session_id,
      pageUrl: visitor.page_url,
      pageTitle: visitor.page_title,
      visitTime: visitor.visit_time,
      duration: visitor.duration_seconds || 0,
      browser: visitor.browser || 'Unknown',
      os: visitor.os || 'Unknown',
      deviceType: visitor.device_type || 'Unknown',
      country: visitor.country || 'Unknown',
    }));

    return NextResponse.json({
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error in realtime activity API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
