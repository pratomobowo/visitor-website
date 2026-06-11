import { NextRequest, NextResponse } from 'next/server';
import { query, insertAndReturn } from '@/lib/postgres';
import { requireAuth, isUser } from '@/lib/require-auth';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

// GET - Fetch all websites (requires auth)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!isUser(authResult)) return authResult;

    const websites = await query(`
      SELECT * FROM websites
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ websites: websites || [] });

  } catch (error) {
    console.error('Error in websites GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new website (requires auth)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!isUser(authResult)) return authResult;

    const { name, domain } = await request.json();

    if (!name || !domain) {
      return NextResponse.json(
        { error: 'Name and domain are required' },
        { status: 400 }
      );
    }

    // Generate unique tracking ID
    const trackingId = generateTrackingId();

    // Create website
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

// DELETE - Delete website (requires auth)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!isUser(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Website ID is required' },
        { status: 400 }
      );
    }

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