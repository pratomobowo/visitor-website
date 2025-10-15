import { NextRequest, NextResponse } from 'next/server';
import { insertAndReturn } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    const { website_id, session_id, page_url, page_title } = data;
    
    if (!website_id || !session_id || !page_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    
    // Parse user agent (simple implementation)
    const userAgentString = request.headers.get('user-agent') || data.user_agent || '';
    const { browser, os, device_type } = parseUserAgent(userAgentString);
    
    // Extract additional information
    const visitorData = {
      website_id,
      session_id,
      ip_address: ip,
      user_agent: userAgentString,
      referrer: data.referrer || null,
      page_url,
      page_title: page_title || 'Unknown Page',
      visit_time: new Date().toISOString(),
      duration_seconds: data.duration_seconds || 0,
      is_fake: data.is_fake || false,
      country: data.country || null,
      city: data.city || null,
      browser,
      os,
      device_type
    };
    
    // Insert visitor data into PostgreSQL
    console.log('Inserting visitor data:', visitorData);
    const insertData = await insertAndReturn('visitors', visitorData);
    
    console.log('Successfully inserted visitor data:', insertData);
    return NextResponse.json({ success: true, data: insertData });
    
  } catch (error) {
    console.error('Error in track API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseUserAgent(userAgentString: string): { browser: string; os: string; device_type: string } {
  // Simple user agent parsing
  let browser = 'Unknown';
  let os = 'Unknown';
  let device_type = 'desktop';
  
  // Parse browser
  if (userAgentString.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgentString.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgentString.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgentString.includes('Opera')) {
    browser = 'Opera';
  }
  
  // Parse OS
  if (userAgentString.includes('Windows')) {
    os = 'Windows';
  } else if (userAgentString.includes('Mac OS')) {
    os = 'macOS';
  } else if (userAgentString.includes('Linux')) {
    os = 'Linux';
  } else if (userAgentString.includes('Android')) {
    os = 'Android';
  } else if (userAgentString.includes('iOS') || userAgentString.includes('iPhone') || userAgentString.includes('iPad')) {
    os = 'iOS';
  }
  
  // Parse device type
  if (userAgentString.includes('Mobile') || userAgentString.includes('Android') || userAgentString.includes('iPhone')) {
    device_type = 'mobile';
  } else if (userAgentString.includes('Tablet') || userAgentString.includes('iPad')) {
    device_type = 'tablet';
  } else {
    device_type = 'desktop';
  }
  
  return { browser, os, device_type };
}

// Handle CORS for cross-domain tracking
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