import { NextRequest, NextResponse } from 'next/server';
import { insertAndReturn, query } from '@/lib/postgres';

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
    
    // If this is a duration update, update existing record instead of inserting new one
    if (data.is_duration_update && data.duration_seconds) {
      try {
        await query(
          `UPDATE visitors 
           SET duration_seconds = $1 
           WHERE session_id = $2 AND page_url = $3 AND website_id = $4
           AND duration_seconds = 0
           ORDER BY visit_time DESC
           LIMIT 1`,
          [Math.round(data.duration_seconds), session_id, page_url, website_id]
        );
      } catch {
        // Fallback: PostgreSQL doesn't support ORDER BY + LIMIT in UPDATE directly
        // Use subquery instead
        await query(
          `UPDATE visitors SET duration_seconds = $1 
           WHERE id = (
             SELECT id FROM visitors 
             WHERE session_id = $2 AND page_url = $3 AND website_id = $4 AND duration_seconds = 0
             ORDER BY visit_time DESC LIMIT 1
           )`,
          [Math.round(data.duration_seconds), session_id, page_url, website_id]
        );
      }
      return NextResponse.json({ success: true, updated: true });
    }
    
    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    let ip = 'unknown';
    if (forwardedFor) {
      ip = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ip = realIp;
    }
    
    // Validate IP (support both IPv4 and IPv6)
    if (ip !== 'unknown') {
      const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
      const isIPv6 = /^[0-9a-fA-F:]+$/.test(ip);
      if (!isIPv4 && !isIPv6) {
        ip = 'unknown';
      }
    }
    
    // Parse user agent
    const userAgentString = request.headers.get('user-agent') || data.user_agent || '';
    const { browser, os, device_type } = parseUserAgent(userAgentString);
    
    const visitorData = {
      website_id,
      session_id,
      ip_address: ip === 'unknown' ? null : ip,
      user_agent: userAgentString,
      referrer: data.referrer || null,
      page_url,
      page_title: page_title || 'Unknown Page',
      visit_time: new Date().toISOString(),
      duration_seconds: Math.round(data.duration_seconds) || 0,
      is_fake: data.is_fake || false,
      country: data.country || null,
      city: data.city || null,
      browser,
      os,
      device_type
    };
    
    const insertData = await insertAndReturn('visitors', visitorData);
    
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