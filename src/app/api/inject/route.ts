import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/postgres';
import { requireAdmin, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

interface WeightedItem {
  value: string;
  weight: number;
}

interface CustomPage {
  url: string;
  title: string;
  weight: number;
}

interface InjectPayload {
  websiteId: string;
  visitorCount: number;
  distribution: 'random' | 'peak' | 'night' | 'weekend' | 'weekday';
  // Date config
  year?: string;
  month?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: string;
  // Session config
  minDuration: number;
  maxDuration: number;
  bounceRate: number;
  minPagesPerSession: number;
  maxPagesPerSession: number;
  // Distribution weights
  countries?: WeightedItem[];
  cities?: WeightedItem[];
  devices?: WeightedItem[];
  browsers?: WeightedItem[];
  operatingSystems?: WeightedItem[];
  referrers?: WeightedItem[];
  customPages?: CustomPage[];
}

export async function POST(request: NextRequest) {
  try {
    // Admin only
    const authResult = await requireAdmin(request);
    if (!isUser(authResult)) return authResult;
    const payload: InjectPayload = await request.json();

    const {
      websiteId,
      visitorCount,
      distribution = 'random',
      year,
      month,
      startDate: startDateStr,
      endDate: endDateStr,
      dateRange,
      minDuration = 5,
      maxDuration = 300,
      bounceRate = 40,
      minPagesPerSession = 1,
      maxPagesPerSession = 5,
      countries,
      cities,
      devices,
      browsers,
      operatingSystems,
      referrers,
      customPages,
    } = payload;

    if (!websiteId || !visitorCount) {
      return NextResponse.json(
        { error: 'Website ID and visitor count are required' },
        { status: 400 }
      );
    }

    if (visitorCount > 100000) {
      return NextResponse.json(
        { error: 'Maximum 100,000 visitors per injection' },
        { status: 400 }
      );
    }

    // Get website info
    const website = await queryOne(
      'SELECT * FROM websites WHERE id = $1',
      [websiteId]
    );

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      );
    }

    const websiteData = website as { id: string; domain: string; name: string };

    // Calculate date range
    const { start, end } = calculateDateRange(year, month, startDateStr, endDateStr, dateRange);

    // Generate visitor data
    const fakeVisitors = generateVisitors({
      websiteId,
      domain: websiteData.domain,
      count: visitorCount,
      startDate: start,
      endDate: end,
      distribution,
      minDuration,
      maxDuration,
      bounceRate,
      minPagesPerSession,
      maxPagesPerSession,
      countries: countries || getDefaultCountries(),
      cities: cities || getDefaultCities(),
      devices: devices || getDefaultDevices(),
      browsers: browsers || getDefaultBrowsers(),
      operatingSystems: operatingSystems || getDefaultOS(),
      referrers: referrers || getDefaultReferrers(),
      customPages: customPages || null,
    });

    // Insert data in batches
    const batchSize = 200;
    let insertedCount = 0;

    for (let i = 0; i < fakeVisitors.length; i += batchSize) {
      const batch = fakeVisitors.slice(i, i + batchSize);

      const placeholders = batch.map((_, index) => {
        const offset = index * 15;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`;
      }).join(', ');

      const values = batch.flatMap(visitor => [
        visitor.website_id,
        visitor.session_id,
        visitor.ip_address,
        visitor.user_agent,
        visitor.referrer,
        visitor.page_url,
        visitor.page_title,
        visitor.visit_time,
        visitor.duration_seconds,
        visitor.is_fake,
        visitor.country,
        visitor.city,
        visitor.browser,
        visitor.os,
        visitor.device_type
      ]);

      try {
        await query(`
          INSERT INTO visitors (
            website_id, session_id, ip_address, user_agent, referrer,
            page_url, page_title, visit_time, duration_seconds, is_fake,
            country, city, browser, os, device_type
          ) VALUES ${placeholders}
        `, values);

        insertedCount += batch.length;
      } catch (error) {
        console.error('Error inserting batch:', error);
        return NextResponse.json(
          { error: 'Failed to inject data', details: (error as Error).message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      injectedCount: insertedCount,
      message: `Successfully injected ${insertedCount.toLocaleString()} visitors for ${websiteData.name}`
    });

  } catch (error) {
    console.error('Error in inject API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

// --- Date Range Calculation ---

function calculateDateRange(
  year?: string,
  month?: string,
  startDateStr?: string,
  endDateStr?: string,
  dateRange?: string
): { start: Date; end: Date } {
  const now = new Date();

  if (year && month) {
    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1;
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    return { start, end };
  }

  if (startDateStr && endDateStr) {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  switch (dateRange) {
    case 'today':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: now
      };
    case 'week':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now
      };
    case 'yesterday':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      };
    default:
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: now
      };
  }
}

// --- Weighted Random Selection ---

function weightedRandom(items: WeightedItem[]): string {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return items[0]?.value || '';

  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item.value;
    }
  }
  return items[items.length - 1].value;
}

function weightedRandomPage(pages: CustomPage[]): { url: string; title: string } {
  const totalWeight = pages.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return { url: pages[0]?.url || '/', title: pages[0]?.title || 'Home' };

  let random = Math.random() * totalWeight;
  for (const page of pages) {
    random -= page.weight;
    if (random <= 0) {
      return { url: page.url, title: page.title };
    }
  }
  return { url: pages[pages.length - 1].url, title: pages[pages.length - 1].title };
}

// --- Date Generation with Distribution ---

function generateRandomDate(start: Date, end: Date, distribution: string): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const range = endTime - startTime;

  // Try up to 50 times to match distribution, then accept any random date
  for (let attempt = 0; attempt < 50; attempt++) {
    const randomTime = startTime + Math.random() * range;
    const date = new Date(randomTime);
    const hour = date.getHours();
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday

    switch (distribution) {
      case 'peak':
        // Bias towards 9 AM - 5 PM
        if (hour >= 9 && hour <= 17) return date;
        if (Math.random() < 0.15) return date; // 15% chance outside peak
        break;

      case 'night':
        // Bias towards 8 PM - 2 AM
        if (hour >= 20 || hour <= 2) return date;
        if (Math.random() < 0.15) return date;
        break;

      case 'weekend':
        // Heavier on weekends
        if (day === 0 || day === 6) return date;
        if (Math.random() < 0.3) return date; // 30% on weekdays
        break;

      case 'weekday':
        // Heavier on weekdays
        if (day >= 1 && day <= 5) return date;
        if (Math.random() < 0.2) return date; // 20% on weekends
        break;

      case 'random':
      default:
        return date;
    }
  }

  // Fallback: return random date
  return new Date(startTime + Math.random() * range);
}

// --- Visitor Generation ---

interface GeneratorConfig {
  websiteId: string;
  domain: string;
  count: number;
  startDate: Date;
  endDate: Date;
  distribution: string;
  minDuration: number;
  maxDuration: number;
  bounceRate: number;
  minPagesPerSession: number;
  maxPagesPerSession: number;
  countries: WeightedItem[];
  cities: WeightedItem[];
  devices: WeightedItem[];
  browsers: WeightedItem[];
  operatingSystems: WeightedItem[];
  referrers: WeightedItem[];
  customPages: CustomPage[] | null;
}

interface VisitorRecord {
  website_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  referrer: string | null;
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
}

function generateVisitors(config: GeneratorConfig): VisitorRecord[] {
  const {
    websiteId,
    domain,
    count,
    startDate,
    endDate,
    distribution,
    minDuration,
    maxDuration,
    bounceRate,
    minPagesPerSession,
    maxPagesPerSession,
    countries,
    cities,
    devices,
    browsers,
    operatingSystems,
    referrers,
    customPages,
  } = config;

  const visitors: VisitorRecord[] = [];
  const defaultPages: CustomPage[] = [
    { url: '/', title: 'Home', weight: 30 },
    { url: '/about', title: 'About Us', weight: 15 },
    { url: '/services', title: 'Services', weight: 15 },
    { url: '/products', title: 'Products', weight: 12 },
    { url: '/blog', title: 'Blog', weight: 10 },
    { url: '/contact', title: 'Contact', weight: 8 },
    { url: '/gallery', title: 'Gallery', weight: 5 },
    { url: '/testimonials', title: 'Testimonials', weight: 5 },
  ];

  const pages = customPages || defaultPages;

  // Generate sessions. Each session = 1 unique visitor with potentially multiple page views.
  let sessionIndex = 0;

  while (visitors.length < count) {
    const sessionId = `fake_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 7)}_${sessionIndex}`;
    sessionIndex++;

    // Decide if this visitor bounces
    const isBounce = Math.random() * 100 < bounceRate;

    // Number of page views for this session
    let pageViewCount: number;
    if (isBounce) {
      pageViewCount = 1;
    } else {
      pageViewCount = minPagesPerSession + Math.floor(Math.random() * (maxPagesPerSession - minPagesPerSession + 1));
      pageViewCount = Math.max(2, pageViewCount); // Non-bounce must have at least 2
    }

    // Don't exceed total count
    pageViewCount = Math.min(pageViewCount, count - visitors.length);

    // Visitor characteristics (consistent per session)
    const country = weightedRandom(countries);
    const city = weightedRandom(cities);
    const deviceType = weightedRandom(devices);
    const browser = weightedRandom(browsers);
    const os = weightedRandom(operatingSystems);
    const referrer = weightedRandom(referrers);
    const ip = generateRandomIP();
    const userAgent = generateUserAgentForBrowserOS(browser, os, deviceType);

    // Generate a base visit time for this session
    const sessionStartTime = generateRandomDate(startDate, endDate, distribution);

    for (let pageIndex = 0; pageIndex < pageViewCount; pageIndex++) {
      const page = weightedRandomPage(pages);
      const duration = minDuration + Math.floor(Math.random() * (maxDuration - minDuration));

      // Each page view happens a bit after the previous one
      const pageTime = new Date(sessionStartTime.getTime() + pageIndex * duration * 1000);

      // Clamp pageTime to endDate — prevent overflow into next period
      if (pageTime > endDate) {
        break;
      }

      visitors.push({
        website_id: websiteId,
        session_id: sessionId,
        ip_address: ip,
        user_agent: userAgent,
        referrer: referrer === 'direct' ? null : referrer,
        page_url: `https://${domain}${page.url}`,
        page_title: page.title,
        visit_time: pageTime.toISOString(),
        duration_seconds: duration,
        is_fake: true,
        country,
        city,
        browser,
        os,
        device_type: deviceType,
      });
    }
  }

  return visitors;
}

// --- Helper Generators ---

function generateRandomIP(): string {
  // Avoid reserved ranges
  const first = Math.floor(Math.random() * 223) + 1;
  return `${first}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 254) + 1}`;
}

function generateUserAgentForBrowserOS(browser: string, os: string, deviceType: string): string {
  const osStrings: Record<string, string> = {
    'Windows': 'Windows NT 10.0; Win64; x64',
    'macOS': 'Macintosh; Intel Mac OS X 10_15_7',
    'Linux': 'X11; Linux x86_64',
    'Android': 'Linux; Android 13; SM-G991B',
    'iOS': 'iPhone; CPU iPhone OS 17_0 like Mac OS X',
  };

  const browserVersions: Record<string, string> = {
    'Chrome': '120.0.6099.109',
    'Firefox': '121.0',
    'Safari': '17.2',
    'Edge': '120.0.2210.91',
    'Opera': '105.0.4970.29',
  };

  const osStr = osStrings[os] || osStrings['Windows'];
  const version = browserVersions[browser] || browserVersions['Chrome'];

  // Mobile override for Android/iOS
  if (deviceType === 'mobile' && os === 'iOS') {
    return `Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Mobile/15E148 Safari/604.1`;
  }

  if (deviceType === 'mobile' && os === 'Android') {
    return `Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Mobile Safari/537.36`;
  }

  if (deviceType === 'tablet') {
    return `Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Mobile/15E148 Safari/604.1`;
  }

  switch (browser) {
    case 'Chrome':
      return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
    case 'Firefox':
      return `Mozilla/5.0 (${osStr}; rv:${version}) Gecko/20100101 Firefox/${version}`;
    case 'Safari':
      return `Mozilla/5.0 (${osStr}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`;
    case 'Edge':
      return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 Edg/${version}`;
    case 'Opera':
      return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36 OPR/${version}`;
    default:
      return `Mozilla/5.0 (${osStr}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`;
  }
}

// --- Default Distributions ---

function getDefaultCountries(): WeightedItem[] {
  return [
    { value: 'ID', weight: 50 },
    { value: 'US', weight: 15 },
    { value: 'SG', weight: 10 },
    { value: 'MY', weight: 8 },
    { value: 'AU', weight: 5 },
    { value: 'JP', weight: 4 },
    { value: 'KR', weight: 3 },
    { value: 'IN', weight: 3 },
    { value: 'TH', weight: 2 },
  ];
}

function getDefaultCities(): WeightedItem[] {
  return [
    { value: 'Jakarta', weight: 30 },
    { value: 'Bandung', weight: 15 },
    { value: 'Surabaya', weight: 12 },
    { value: 'Medan', weight: 10 },
    { value: 'Semarang', weight: 8 },
    { value: 'Makassar', weight: 7 },
    { value: 'Tangerang', weight: 6 },
    { value: 'Palembang', weight: 5 },
    { value: 'Yogyakarta', weight: 4 },
    { value: 'Denpasar', weight: 3 },
  ];
}

function getDefaultDevices(): WeightedItem[] {
  return [
    { value: 'desktop', weight: 55 },
    { value: 'mobile', weight: 38 },
    { value: 'tablet', weight: 7 },
  ];
}

function getDefaultBrowsers(): WeightedItem[] {
  return [
    { value: 'Chrome', weight: 60 },
    { value: 'Safari', weight: 18 },
    { value: 'Firefox', weight: 10 },
    { value: 'Edge', weight: 8 },
    { value: 'Opera', weight: 4 },
  ];
}

function getDefaultOS(): WeightedItem[] {
  return [
    { value: 'Windows', weight: 40 },
    { value: 'Android', weight: 25 },
    { value: 'macOS', weight: 15 },
    { value: 'iOS', weight: 15 },
    { value: 'Linux', weight: 5 },
  ];
}

function getDefaultReferrers(): WeightedItem[] {
  return [
    { value: 'direct', weight: 30 },
    { value: 'https://www.google.com', weight: 35 },
    { value: 'https://www.facebook.com', weight: 12 },
    { value: 'https://www.instagram.com', weight: 8 },
    { value: 'https://www.twitter.com', weight: 5 },
    { value: 'https://www.linkedin.com', weight: 5 },
    { value: 'https://www.youtube.com', weight: 3 },
    { value: 'https://www.tiktok.com', weight: 2 },
  ];
}
