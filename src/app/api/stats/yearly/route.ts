import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const websiteId = searchParams.get('websiteId');
    const fromYear = parseInt(searchParams.get('fromYear') || (new Date().getFullYear() - 4).toString(), 10);
    const toYear = parseInt(searchParams.get('toYear') || new Date().getFullYear().toString(), 10);

    if (!websiteId) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

    const startDate = new Date(fromYear, 0, 1); // January 1st
    const endDate = new Date(toYear, 11, 31, 23, 59, 59, 999); // December 31st

    // Get all visitor data for the year range
    const visitorData = await query(`
      SELECT visit_time, session_id, page_url, page_title, device_type, browser, os, referrer, duration_seconds
      FROM visitors
      WHERE website_id = $1
      AND visit_time >= $2
      AND visit_time <= $3
      ORDER BY visit_time ASC
    `, [websiteId, startDate.toISOString(), endDate.toISOString()]);

    if (!visitorData || visitorData.length === 0) {
      return NextResponse.json({
        summary: {
          totalPageViews: 0,
          uniqueVisitors: 0,
          totalSessions: 0,
          averageDuration: 0,
          bounceRate: 0,
        },
        yearlyData: generateEmptyYears(fromYear, toYear),
        topPages: [],
        deviceStats: { devices: {}, browsers: {}, os: {} },
        referrerStats: {},
      });
    }

    // Calculate summary stats
    const totalPageViews = visitorData.length;
    const uniqueVisitors = new Set((visitorData as { session_id: string }[]).map((v) => v.session_id)).size;
    const totalSessions = new Set((visitorData as { session_id: string }[]).map((v) => v.session_id)).size;
    const averageDuration = (visitorData as { duration_seconds?: number }[]).reduce((sum: number, v) => sum + (v.duration_seconds || 0), 0) / totalPageViews || 0;
    const bounceRate = calculateBounceRate(visitorData as { session_id: string }[]);

    // Group data by year
    const yearlyData = groupByYear(visitorData as Array<{
      visit_time: string;
      session_id: string;
      page_url?: string;
      page_title?: string;
      device_type?: string;
      browser?: string;
      os?: string;
      referrer?: string;
      duration_seconds?: number;
    }>, fromYear, toYear);

    // Get top pages
    const topPages = getTopPages(visitorData as Array<{ page_url: string; page_title: string }>, 10);

    // Get device stats
    const deviceStats = getDeviceStats(visitorData as Array<{
      device_type: string;
      browser: string;
      os: string;
    }>);

    // Get referrer stats
    const referrerStats = getReferrerStats(visitorData as Array<{ referrer: string }>);

    return NextResponse.json({
      summary: {
        totalPageViews,
        uniqueVisitors,
        totalSessions,
        averageDuration: Math.round(averageDuration),
        bounceRate,
      },
      yearlyData,
      topPages,
      deviceStats,
      referrerStats,
    });
  } catch (error) {
    console.error('Error in yearly stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateEmptyYears(fromYear: number, toYear: number) {
  const years = [];

  for (let year = toYear; year >= fromYear; year--) {
    years.push({
      year,
      pageViews: 0,
      uniqueVisitors: 0,
      totalSessions: 0,
      averageDuration: 0,
      bounceRate: 0,
      growthRate: 0,
    });
  }

  return years;
}

function groupByYear(data: Array<{
  visit_time: string;
  session_id: string;
  page_url?: string;
  page_title?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  duration_seconds?: number;
}>, fromYear: number, toYear: number) {
  const yearlyMap: Record<number, {
    pageViews: number;
    sessions: Set<string>;
    avgDuration: number;
    totalDuration: number;
    count: number;
  }> = {};

  // Initialize all years
  for (let year = fromYear; year <= toYear; year++) {
    yearlyMap[year] = {
      pageViews: 0,
      sessions: new Set(),
      avgDuration: 0,
      totalDuration: 0,
      count: 0,
    };
  }

  // Group data by year
  data.forEach((item) => {
    const date = new Date(item.visit_time);
    const year = date.getFullYear();

    if (year >= fromYear && year <= toYear) {
      yearlyMap[year].pageViews++;
      yearlyMap[year].sessions.add(item.session_id);
      yearlyMap[year].totalDuration += item.duration_seconds || 0;
      yearlyMap[year].count++;
    }
  });

  // Convert to array with calculated metrics (sorted DESC by year)
  const yearsArray = Object.entries(yearlyMap)
    .sort(([yearA], [yearB]) => parseInt(yearB, 10) - parseInt(yearA, 10))
    .map(([year, stats]) => {
      const yearNum = parseInt(year, 10);
      return {
        year: yearNum,
        pageViews: stats.pageViews,
        uniqueVisitors: stats.sessions.size,
        totalSessions: stats.sessions.size,
        averageDuration: stats.count > 0 ? Math.round(stats.totalDuration / stats.count) : 0,
        bounceRate: calculateYearBounceRate(data, yearNum),
        growthRate: 0, // Will be calculated after
      };
    });

  // Calculate growth rate (% change from previous year)
  for (let i = 0; i < yearsArray.length - 1; i++) {
    const current = yearsArray[i];
    const previous = yearsArray[i + 1];

    if (previous.pageViews > 0) {
      current.growthRate = Math.round(((current.pageViews - previous.pageViews) / previous.pageViews) * 100);
    }
  }

  return yearsArray;
}

function calculateYearBounceRate(data: Array<{ visit_time: string; session_id: string }>, year: number): number {
  const yearData = data.filter((item) => {
    const date = new Date(item.visit_time);
    return date.getFullYear() === year;
  });

  if (yearData.length === 0) return 0;

  const sessions: Map<string, Array<{ visit_time: string; session_id: string }>> = new Map();

  yearData.forEach((visitor) => {
    if (!sessions.has(visitor.session_id)) {
      sessions.set(visitor.session_id, []);
    }
    const sessionVisitors = sessions.get(visitor.session_id);
    if (sessionVisitors) {
      sessionVisitors.push(visitor);
    }
  });

  let bouncedSessions = 0;
  sessions.forEach((sessionVisitors) => {
    if (sessionVisitors.length === 1) {
      bouncedSessions++;
    }
  });

  return sessions.size > 0 ? Math.round((bouncedSessions / sessions.size) * 100) : 0;
}

function getTopPages(data: Array<{ page_url: string; page_title: string }>, limit: number = 10) {
  const pageCounts: Record<string, { url: string; title: string; count: number }> = {};

  data.forEach((visitor) => {
    const key = visitor.page_url;
    pageCounts[key] = pageCounts[key] || { url: key, title: visitor.page_title, count: 0 };
    pageCounts[key].count++;
  });

  return Object.values(pageCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getDeviceStats(data: Array<{ device_type: string; browser: string; os: string }>) {
  const deviceStats: { devices: Record<string, number>; browsers: Record<string, number>; os: Record<string, number> } = {
    devices: {},
    browsers: {},
    os: {},
  };

  data.forEach((visitor) => {
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

  return deviceStats;
}

function getReferrerStats(data: Array<{ referrer: string }>) {
  const referrerStats: Record<string, number> = {};

  data.forEach((visitor) => {
    const referrer = visitor.referrer || 'direct';
    referrerStats[referrer] = (referrerStats[referrer] || 0) + 1;
  });

  return referrerStats;
}

function calculateBounceRate(visitors: { session_id: string }[]): number {
  const sessions: Map<string, { session_id: string }[]> = new Map();

  visitors.forEach((visitor) => {
    if (!sessions.has(visitor.session_id)) {
      sessions.set(visitor.session_id, []);
    }
    const sessionVisitors = sessions.get(visitor.session_id);
    if (sessionVisitors) {
      sessionVisitors.push(visitor);
    }
  });

  let bouncedSessions = 0;
  sessions.forEach((sessionVisitors) => {
    if (sessionVisitors.length === 1) {
      bouncedSessions++;
    }
  });

  return sessions.size > 0 ? Math.round((bouncedSessions / sessions.size) * 100) : 0;
}
