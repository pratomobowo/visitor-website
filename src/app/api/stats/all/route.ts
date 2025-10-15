import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    
    // Calculate date range
    const { startDate, endDate, groupBy } = getDateRange(period);
    
    // Get all websites
    const websites = await query('SELECT id FROM websites');
    
    if (!websites || websites.length === 0) {
      return NextResponse.json({
        summary: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          totalSessions: 0,
          averageDuration: 0,
          bounceRate: 0
        },
        timeSeries: [],
        topPages: [],
        deviceStats: { devices: {}, browsers: {}, os: {} },
        referrerStats: {}
      });
    }
    
    const websiteIds = (websites as { id: string }[]).map((w) => w.id);
    
    // Get basic stats for all websites using PostgreSQL
    const basicStats = await query(`
      SELECT * FROM visitors
      WHERE website_id = ANY($1)
      AND visit_time >= $2
      AND visit_time <= $3
    `, [websiteIds, startDate.toISOString(), endDate.toISOString()]);
    
    // Process the stats data
    return processStatsData(basicStats as Array<{
      id: string;
      website_id: string;
      session_id: string;
      ip_address: string;
      user_agent: string;
      referrer: string;
      page_url: string;
      page_title: string;
      visit_time: string;
      duration_seconds: number;
      is_fake: boolean;
      country: string;
      city: string;
      browser: string;
      os: string;
      device_type: string;
    }>, websiteIds, startDate, endDate, groupBy);
  } catch (error) {
    console.error('Error in all stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processStatsData(
  basicStats: Array<{
    id: string;
    website_id: string;
    session_id: string;
    ip_address: string;
    user_agent: string;
    referrer: string;
    page_url: string;
    page_title: string;
    visit_time: string;
    duration_seconds: number;
    is_fake: boolean;
    country: string;
    city: string;
    browser: string;
    os: string;
    device_type: string;
  }>,
  websiteIds: string[],
  startDate: Date,
  endDate: Date,
  groupBy: string
) {
  // Calculate metrics
  const totalPageViews = basicStats.length;
  const uniqueVisitors = new Set(basicStats.map(v => v.session_id)).size;
  const totalSessions = new Set(basicStats.map(v => v.session_id)).size;
  const averageDuration = basicStats.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / totalPageViews || 0;
  
  // Get time series data using PostgreSQL
  const timeSeriesData = await query(`
    SELECT visit_time, session_id FROM visitors
    WHERE website_id = ANY($1)
    AND visit_time >= $2
    AND visit_time <= $3
    ORDER BY visit_time ASC
  `, [websiteIds, startDate.toISOString(), endDate.toISOString()]);
  
  // Group time series data
  const groupedData = groupTimeSeriesData(timeSeriesData as { visit_time: string; session_id: string }[], groupBy);
  
  // Get top pages across all websites using PostgreSQL
  const topPagesData = await query(`
    SELECT page_url, page_title FROM visitors
    WHERE website_id = ANY($1)
    AND visit_time >= $2
    AND visit_time <= $3
  `, [websiteIds, startDate.toISOString(), endDate.toISOString()]);
  
  let topPages: Array<{
    url: string;
    title: string;
    count: number;
  }> = [];
  if (topPagesData) {
    const pageCounts = (topPagesData as { page_url: string; page_title: string }[]).reduce((acc: Record<string, { url: string; title: string; count: number }>, visitor) => {
      const key = visitor.page_url;
      acc[key] = acc[key] || { url: key, title: visitor.page_title, count: 0 };
      acc[key].count++;
      return acc;
    }, {});
    
    topPages = Object.values(pageCounts)
      .sort((a: { url: string; title: string; count: number }, b: { url: string; title: string; count: number }) => b.count - a.count)
      .slice(0, 10);
  }
  
  // Get device stats using PostgreSQL
  const deviceData = await query(`
    SELECT device_type, browser, os FROM visitors
    WHERE website_id = ANY($1)
    AND visit_time >= $2
    AND visit_time <= $3
  `, [websiteIds, startDate.toISOString(), endDate.toISOString()]);
  
  const deviceStats: { devices: Record<string, number>; browsers: Record<string, number>; os: Record<string, number> } = { devices: {}, browsers: {}, os: {} };
  if (deviceData) {
    (deviceData as Array<{
      device_type: string;
      browser: string;
      os: string;
    }>).forEach((visitor) => {
      // Device types
      const device = visitor.device_type || 'unknown';
      deviceStats.devices[device] = (deviceStats.devices[device] || 0) + 1;
      
      // Browsers
      const browser = visitor.browser || 'unknown';
      deviceStats.browsers[browser] = (deviceStats.browsers[browser] || 0) + 1;
      
      // Operating systems
      const os = visitor.os || 'unknown';
      deviceStats.os[os] = (deviceStats.os[os] || 0) + 1;
    });
  }
  
  // Get referrer stats using PostgreSQL
  const referrerData = await query(`
    SELECT referrer FROM visitors
    WHERE website_id = ANY($1)
    AND visit_time >= $2
    AND visit_time <= $3
  `, [websiteIds, startDate.toISOString(), endDate.toISOString()]);
  
  const referrerStats: Record<string, number> = {};
  if (referrerData) {
    (referrerData as Array<{ referrer: string }>).forEach((visitor) => {
      const referrer = visitor.referrer || 'direct';
      referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
    });
  }
    
    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        averageDuration: Math.round(averageDuration),
        bounceRate: calculateBounceRate(basicStats)
      },
      timeSeries: groupedData,
      topPages,
      deviceStats,
      referrerStats
    });
}

function getDateRange(period: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate, groupBy;
  
  switch (period) {
    case 'today':
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      groupBy = 'hour';
      break;
    case 'yesterday':
      startDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      endDate = today;
      groupBy = 'hour';
      break;
    case 'week':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
      groupBy = 'day';
      break;
    case 'month':
      startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
      groupBy = 'day';
      break;
    case 'year':
      startDate = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
      endDate = now;
      groupBy = 'month';
      break;
    default:
      startDate = today;
      endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      groupBy = 'hour';
  }
  
  return { startDate, endDate, groupBy };
}

function groupTimeSeriesData(data: { visit_time: string; session_id: string }[], groupBy: string) {
  const grouped: Record<string, { date: string; pageViews: number; uniqueVisitors: Set<string> }> = {};
  
  data.forEach(item => {
    const date = new Date(item.visit_time);
    let key;
    
    switch (groupBy) {
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString();
    }
    
    if (!grouped[key]) {
      grouped[key] = { date: key, pageViews: 0, uniqueVisitors: new Set() };
    }
    
    grouped[key].pageViews++;
    grouped[key].uniqueVisitors.add(item.session_id);
  });
  
  // Convert Set to count and sort by date
  return Object.values(grouped)
    .map((item) => ({
      date: item.date,
      pageViews: item.pageViews,
      uniqueVisitors: item.uniqueVisitors.size
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateBounceRate(visitors: { session_id: string }[]): number {
  const sessions: Map<string, { session_id: string }[]> = new Map();
  
  visitors.forEach(visitor => {
    if (!sessions.has(visitor.session_id)) {
      sessions.set(visitor.session_id, []);
    }
    sessions.get(visitor.session_id)?.push(visitor);
  });
  
  let bouncedSessions = 0;
  sessions.forEach((sessionVisitors) => {
    if (sessionVisitors.length === 1) {
      bouncedSessions++;
    }
  });
  
  return Math.round((bouncedSessions / sessions.size) * 100);
}