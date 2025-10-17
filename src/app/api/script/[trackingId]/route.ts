import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/postgres';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

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
    
    // Verify that the website exists and is active
    const website = await queryOne(
      'SELECT * FROM websites WHERE tracking_id = $1 AND is_active = true',
      [trackingId]
    );
    
    if (!website) {
      return NextResponse.json(
        { error: 'Invalid or inactive tracking ID' },
        { status: 404 }
      );
    }
    
    // Get the base URL from the request
    const baseUrl = request.headers.get('host') || 'localhost:3001';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const apiUrl = `${protocol}://${baseUrl}/api/track`;
    
    // Read the tracking script template
    const scriptPath = join(process.cwd(), 'public', 'track.js');
    
    let scriptContent;
    try {
      scriptContent = await readFile(scriptPath, 'utf8');
    } catch (error) {
      console.error('Error reading tracking script:', error);
      return NextResponse.json(
        { error: 'Tracking script not found' },
        { status: 500 }
      );
    }
    
    // Replace placeholders with actual values
    scriptContent = scriptContent
      .replace('https://your-app.vercel.app/api/track', apiUrl)
      .replace('WEBSITE_ID_PLACEHOLDER', (website as { id: string }).id); // Use actual website UUID, not tracking_id
    
    // Return the script with appropriate headers
    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching during development
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error in script API:', error);
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