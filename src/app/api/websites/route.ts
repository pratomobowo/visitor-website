import { NextRequest, NextResponse } from 'next/server';
import { query, insertAndReturn } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// GET - Fetch all websites
export async function GET() {
  try {
    console.log('Fetching websites...');
    
    // Fetch websites using PostgreSQL
    const websites = await query(`
      SELECT * FROM websites
      ORDER BY created_at DESC
    `);
    
    console.log('Successfully fetched websites:', websites?.length || 0);
    
    // If no websites exist, create a sample one for testing
    if (!websites || websites.length === 0) {
      try {
        const newWebsite = await insertAndReturn('websites', {
          name: 'Example Website',
          domain: 'example.com',
          tracking_id: 'EXAMPLE123',
          is_active: true
        });
        
        console.log('Created sample website:', newWebsite);
        return NextResponse.json({ websites: [newWebsite] });
      } catch (insertError) {
        console.error('Error creating sample website:', insertError);
      }
    }
    
    return NextResponse.json({ websites: websites || [] });
    
  } catch (error) {
    console.error('Error in websites GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new website
export async function POST(request: NextRequest) {
  try {
    const { name, domain } = await request.json();
    
    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }
    
    // Generate unique tracking ID
    const trackingId = generateTrackingId();
    
    // Create website using PostgreSQL
    const website = await insertAndReturn('websites', {
      name,
      domain,
      tracking_id: trackingId
    });
    
    return NextResponse.json({ website });
    
  } catch (error) {
    console.error('Error in websites POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete website
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }
    
    // Delete website using PostgreSQL
    await query('DELETE FROM websites WHERE id = $1', [id]);
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in websites DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateTrackingId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}