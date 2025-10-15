import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { trackingId, testUrl } = await request.json();
    
    if (!trackingId) {
      return NextResponse.json(
        { error: 'Tracking ID is required' },
        { status: 400 }
      );
    }
    
    // Verify that the website exists
    const website = await queryOne(
      'SELECT * FROM websites WHERE tracking_id = $1',
      [trackingId]
    );
    
    if (!website) {
      return NextResponse.json(
        { error: 'Invalid tracking ID or website not found' },
        { status: 404 }
      );
    }
    
    // Check recent visitor data for this website
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const recentVisitors = await query(`
      SELECT * FROM visitors
      WHERE website_id = $1
      AND visit_time >= $2
      ORDER BY visit_time DESC
      LIMIT 10
    `, [(website as { id: string }).id, fiveMinutesAgo]);
    
    // Check if there are any recent test visits
    const testVisits = (recentVisitors as Array<{ page_url: string; visit_time: string }>)?.filter((v) =>
      v.page_url && v.page_url.includes('test=true')
    ) || [];
    
    const hasRecentActivity = recentVisitors && recentVisitors.length > 0;
    const hasTestActivity = testVisits.length > 0;
    
    return NextResponse.json({
      success: true,
      website: {
        id: (website as { id: string }).id,
        name: (website as { name: string }).name,
        domain: (website as { domain: string }).domain,
        tracking_id: (website as { tracking_id: string }).tracking_id,
        is_active: (website as { is_active: boolean }).is_active
      },
      tracking: {
        hasRecentActivity,
        hasTestActivity,
        recentVisitorCount: recentVisitors?.length || 0,
        testVisitorCount: testVisits.length,
        lastTestVisit: testVisits[0]?.visit_time || null,
        recentVisitors: (recentVisitors as {
          page_url: string;
          page_title: string;
          visit_time: string;
          browser: string;
          os: string;
          device_type: string;
        }[])?.map((v) => ({
          page_url: v.page_url,
          page_title: v.page_title,
          visit_time: v.visit_time,
          browser: v.browser,
          os: v.os,
          device_type: v.device_type,
          is_test: v.page_url && v.page_url.includes('test=true')
        })) || []
      },
      testUrl: testUrl || `${(website as { domain: string }).domain}?test=true`,
      recommendations: generateRecommendations(hasRecentActivity, hasTestActivity, website as {
        id: string;
        name: string;
        domain: string;
        tracking_id: string;
        is_active: boolean;
      })
    });
    
  } catch (error) {
    console.error('Error in test-tracking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRecommendations(hasRecentActivity: boolean, hasTestActivity: boolean, website: {
  id: string;
  name: string;
  domain: string;
  tracking_id: string;
  is_active: boolean;
}) {
  const recommendations = [];
  
  if (!website.is_active) {
    recommendations.push({
      type: 'warning',
      message: 'Website is not active. Activate it to start tracking.',
      action: 'activate_website'
    });
  }
  
  if (!hasRecentActivity) {
    recommendations.push({
      type: 'error',
      message: 'No recent tracking data detected. Check if the tracking script is properly installed.',
      action: 'check_script'
    });
  } else if (!hasTestActivity) {
    recommendations.push({
      type: 'info',
      message: 'Tracking is working, but no test visits found. Try visiting your website with ?test=true parameter.',
      action: 'test_visit'
    });
  } else {
    recommendations.push({
      type: 'success',
      message: 'Tracking is working perfectly! Test visits detected.',
      action: 'none'
    });
  }
  
  return recommendations;
}

// Handle CORS for cross-domain requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}