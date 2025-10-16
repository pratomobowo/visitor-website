import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: Checking visitor data in database...');
    
    // Get total count of visitors
    const totalVisitors = await query('SELECT COUNT(*) as count FROM visitors');
    console.log('DEBUG: Total visitors in database:', totalVisitors[0]?.count || 0);
    
    // Get all websites
    const websites = await query('SELECT * FROM websites');
    console.log('DEBUG: Total websites:', websites?.length || 0);
    
    if (websites && websites.length > 0) {
      // Get visitor count per website
      for (const website of websites as { id: string; name: string; domain: string }[]) {
        const websiteVisitors = await query(
          'SELECT COUNT(*) as count FROM visitors WHERE website_id = $1',
          [website.id]
        );
        console.log(`DEBUG: Website ${website.name} (${website.id}) has ${websiteVisitors[0]?.count || 0} visitors`);
      }
    }
    
    // Get recent visitors (last 24 hours)
    const recentVisitors = await query(`
      SELECT v.*, w.name as website_name, w.domain 
      FROM visitors v
      JOIN websites w ON v.website_id = w.id
      WHERE v.visit_time >= NOW() - INTERVAL '24 hours'
      ORDER BY v.visit_time DESC
      LIMIT 10
    `);
    
    console.log('DEBUG: Recent visitors (last 24 hours):', recentVisitors?.length || 0);
    
    // Get all visitors if there are no recent ones
    if (!recentVisitors || recentVisitors.length === 0) {
      const allVisitors = await query(`
        SELECT v.*, w.name as website_name, w.domain 
        FROM visitors v
        JOIN websites w ON v.website_id = w.id
        ORDER BY v.visit_time DESC
        LIMIT 10
      `);
      
      console.log('DEBUG: All visitors (sample):', allVisitors?.length || 0);
      
      return NextResponse.json({
        totalVisitors: totalVisitors[0]?.count || 0,
        totalWebsites: websites?.length || 0,
        recentVisitors: recentVisitors?.length || 0,
        allVisitors: allVisitors || [],
        websites: websites || []
      });
    }
    
    return NextResponse.json({
      totalVisitors: totalVisitors[0]?.count || 0,
      totalWebsites: websites?.length || 0,
      recentVisitors: recentVisitors?.length || 0,
      visitors: recentVisitors || [],
      websites: websites || []
    });
    
  } catch (error) {
    console.error('DEBUG: Error checking visitor data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}