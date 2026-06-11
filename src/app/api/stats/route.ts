import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAuth, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!isUser(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const period = searchParams.get('period') || 'today';

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    const { startDate, endDate, groupBy } = getDateRange(period);
    const start = startDate.toISOString();
    const end = endDate.toISOString();

    // All queries run in parallel using SQL aggregation (no SELECT * into memory)
    const [summaryResult, timeSeriesResult, topPagesResult, deviceResult, browserResult, osResult, referrerResult, bounceResult] = await Promise.all([
      // Summary stats
      query(`
        SELECT
          COUNT(*) as total_page_views,
          COUNT(DISTINCT session_id) as unique_visitors,
          COUNT(DISTINCT session_id) as total_sessions,
          COALESCE(AVG(duration_seconds), 0)::integer as average_duration
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
      `, [websiteId, start, end]),

      // Time series (grouped by hour/day/month in SQL)
      query(`
        SELECT
          ${getTimeSeriesGroupSQL(groupBy)} as period,
          COUNT(*) as page_views,
          COUNT(DISTINCT session_id) as unique_visitors
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY period
        ORDER BY period ASC
      `, [websiteId, start, end]),

      // Top pages
      query(`
        SELECT page_url as url, MAX(page_title) as title, COUNT(*) as count
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY page_url
        ORDER BY count DESC
        LIMIT 10
      `, [websiteId, start, end]),

      // Device distribution
      query(`
        SELECT COALESCE(device_type, 'unknown') as device, COUNT(*) as count
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY device_type
        ORDER BY count DESC
      `, [websiteId, start, end]),

      // Browser distribution
      query(`
        SELECT COALESCE(browser, 'unknown') as browser, COUNT(*) as count
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY browser
        ORDER BY count DESC
      `, [websiteId, start, end]),

      // OS distribution
      query(`
        SELECT COALESCE(os, 'unknown') as os, COUNT(*) as count
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY os
        ORDER BY count DESC
      `, [websiteId, start, end]),

      // Referrer distribution
      query(`
        SELECT COALESCE(referrer, 'direct') as referrer, COUNT(*) as count
        FROM visitors
        WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
        GROUP BY referrer
        ORDER BY count DESC
      `, [websiteId, start, end]),

      // Bounce rate (sessions with only 1 page view)
      query(`
        SELECT
          COUNT(*) as total_sessions,
          COUNT(*) FILTER (WHERE page_count = 1) as bounced_sessions
        FROM (
          SELECT session_id, COUNT(*) as page_count
          FROM visitors
          WHERE website_id = $1 AND visit_time >= $2 AND visit_time <= $3
          GROUP BY session_id
        ) session_counts
      `, [websiteId, start, end]),
    ]);

    // Format results
    const summary = summaryResult[0] as { total_page_views: string; unique_visitors: string; total_sessions: string; average_duration: number };
    const bounce = bounceResult[0] as { total_sessions: string; bounced_sessions: string };
    const totalSessions = parseInt(bounce?.total_sessions || '0');
    const bouncedSessions = parseInt(bounce?.bounced_sessions || '0');
    const bounceRate = totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;

    const timeSeries = (timeSeriesResult as { period: string; page_views: string; unique_visitors: string }[]).map(row => ({
      date: row.period,
      pageViews: parseInt(row.page_views),
      uniqueVisitors: parseInt(row.unique_visitors),
    }));

    const topPages = (topPagesResult as { url: string; title: string; count: string }[]).map(row => ({
      url: row.url,
      title: row.title,
      count: parseInt(row.count),
    }));

    const deviceStats = {
      devices: Object.fromEntries((deviceResult as { device: string; count: string }[]).map(r => [r.device, parseInt(r.count)])),
      browsers: Object.fromEntries((browserResult as { browser: string; count: string }[]).map(r => [r.browser, parseInt(r.count)])),
      os: Object.fromEntries((osResult as { os: string; count: string }[]).map(r => [r.os, parseInt(r.count)])),
    };

    const referrerStats = Object.fromEntries(
      (referrerResult as { referrer: string; count: string }[]).map(r => [r.referrer, parseInt(r.count)])
    );

    return NextResponse.json({
      summary: {
        totalPageViews: parseInt(summary?.total_page_views || '0'),
        uniqueVisitors: parseInt(summary?.unique_visitors || '0'),
        totalSessions: parseInt(summary?.total_sessions || '0'),
        averageDuration: summary?.average_duration || 0,
        bounceRate,
      },
      timeSeries,
      topPages,
      deviceStats,
      referrerStats,
    });

  } catch (error) {
    console.error('Error in stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTimeSeriesGroupSQL(groupBy: string): string {
  switch (groupBy) {
    case 'hour':
      return "TO_CHAR(visit_time, 'YYYY-MM-DD HH24:00')";
    case 'day':
      return "TO_CHAR(visit_time, 'YYYY-MM-DD')";
    case 'month':
      return "TO_CHAR(visit_time, 'YYYY-MM')";
    default:
      return "TO_CHAR(visit_time, 'YYYY-MM-DD')";
  }
}

function getDateRange(period: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let startDate, endDate, groupBy;

  if (period.startsWith('custom:')) {
    const [, startDateStr, endDateStr] = period.split(':');
    startDate = new Date(startDateStr);
    endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    groupBy = daysDiff <= 1 ? 'hour' : daysDiff <= 31 ? 'day' : 'month';
  } else {
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
  }

  return { startDate, endDate, groupBy };
}
