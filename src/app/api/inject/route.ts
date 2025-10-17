import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { websiteId, visitorCount, dateRange, distribution, year, month } = await request.json();
    
    if (!websiteId || !visitorCount) {
      return NextResponse.json(
        { error: 'Website ID and visitor count are required' },
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
    
    // Generate fake visitor data
    const fakeVisitors = generateFakeVisitors(
      website as { domain: string; name: string },
      websiteId,
      visitorCount,
      dateRange || 'today',
      distribution || 'even',
      year,
      month
    );
    
    // Insert data in batches to avoid timeout
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < fakeVisitors.length; i += batchSize) {
      const batch = fakeVisitors.slice(i, i + batchSize);
      
      console.log('Inserting batch:', batch.length);
      
      // Create placeholder string for batch insert
      const placeholders = batch.map((_, index) => {
        const offset = index * 15; // 15 fields per visitor (website_id through device_type)
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13}, $${offset + 14}, $${offset + 15})`;
      }).join(', ');
      
      // Flatten all values
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
      message: `Successfully injected ${insertedCount} fake visitors for ${(website as { name: string }).name}`
    });
    
  } catch (error) {
    console.error('Error in inject API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

function generateFakeVisitors(
  website: { domain: string; name: string },
  websiteId: string,
  count: number,
  dateRange: string,
  distribution: string,
  year?: string,
  month?: string
): {
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
}[] {
  const visitors = [];
  const now = new Date();
  let startDate, endDate;
  
  // If year and month are provided, use them to set the date range
  if (year && month) {
    const selectedYear = parseInt(year);
    const selectedMonth = parseInt(month) - 1; // JavaScript months are 0-indexed
    
    // Set start date to beginning of the selected month
    startDate = new Date(selectedYear, selectedMonth, 1);
    
    // Set end date to end of the selected month
    endDate = new Date(selectedYear, selectedMonth + 1, 0); // Last day of the month
  } else {
    // Fallback to original date range logic
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;
      case 'yesterday':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
    }
  }
  
  // Generate visitors
  for (let i = 0; i < count; i++) {
    const visitTime = generateRandomDate(startDate, endDate, distribution);
    const sessionId = `fake_session_${Math.random().toString(36).substr(2, 9)}_${i}`;
    
    visitors.push({
      website_id: websiteId,
      session_id: sessionId,
      ip_address: generateRandomIP(),
      user_agent: generateRandomUserAgent(),
      referrer: generateRandomReferrer(),
      page_url: generateRandomPageUrl(website.domain),
      page_title: generateRandomPageTitle(),
      visit_time: visitTime.toISOString(),
      duration_seconds: Math.floor(Math.random() * 300) + 10, // 10-310 seconds
      is_fake: true,
      country: generateRandomCountry(),
      city: generateRandomCity(),
      browser: generateRandomBrowser(),
      os: generateRandomOS(),
      device_type: generateRandomDeviceType()
    });
  }
  
  return visitors;
}

function generateRandomDate(start: Date, end: Date, distribution: string): Date {
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  
  if (distribution === 'peak') {
    // Add bias towards business hours (9 AM - 5 PM)
    const hour = new Date(randomTime).getHours();
    if (hour < 9 || hour > 17) {
      return generateRandomDate(start, end, distribution);
    }
  }
  
  return new Date(randomTime);
}

function generateRandomIP(): string {
  return `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

function generateRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function generateRandomReferrer(): string | null {
  const referrers = [
    'https://www.google.com',
    'https://www.facebook.com',
    'https://www.twitter.com',
    'https://www.instagram.com',
    'https://www.linkedin.com',
    null // Direct traffic
  ];
  
  return referrers[Math.floor(Math.random() * referrers.length)];
}

function generateRandomPageUrl(domain: string): string {
  const pages = [
    '/',
    '/about',
    '/contact',
    '/services',
    '/products',
    '/blog',
    '/gallery',
    '/testimonials'
  ];
  
  return `https://${domain}${pages[Math.floor(Math.random() * pages.length)]}`;
}

function generateRandomPageTitle(): string {
  const titles = [
    'Home',
    'About Us',
    'Contact',
    'Services',
    'Products',
    'Blog',
    'Gallery',
    'Testimonials',
    'Our Team',
    'FAQ'
  ];
  
  return titles[Math.floor(Math.random() * titles.length)];
}

function generateRandomCountry(): string {
  const countries = ['ID', 'US', 'SG', 'MY', 'AU', 'JP', 'KR', 'CN', 'IN', 'TH'];
  return countries[Math.floor(Math.random() * countries.length)];
}

function generateRandomCity(): string {
  const cities = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang'];
  return cities[Math.floor(Math.random() * cities.length)];
}

function generateRandomBrowser(): string {
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
  return browsers[Math.floor(Math.random() * browsers.length)];
}

function generateRandomOS(): string {
  const os = ['Windows', 'MacOS', 'Linux', 'Android', 'iOS'];
  return os[Math.floor(Math.random() * os.length)];
}

function generateRandomDeviceType(): string {
  const types = ['desktop', 'mobile', 'tablet'];
  return types[Math.floor(Math.random() * types.length)];
}

// These functions are defined but not used - keeping for potential future use
// function generateRandomResolution(): string {
//   const resolutions = ['1920x1080', '1366x768', '1440x900', '1280x720', '2560x1440'];
//   return resolutions[Math.floor(Math.random() * resolutions.length)];
// }

// function generateRandomViewport(): string {
//   const viewports = ['1200x800', '1024x768', '800x600', '1440x900', '1920x1080'];
//   return viewports[Math.floor(Math.random() * viewports.length)];
// }