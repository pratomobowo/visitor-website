import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

// Force Node.js runtime for this API route
export const runtime = 'nodejs';

/**
 * POST /api/fix-stats
 * 
 * Fixes the daily_stats table by:
 * 1. Updating the trigger function to correctly count DISTINCT sessions
 * 2. Recalculating all daily_stats from the visitors table
 * 
 * Run this once after deploying the fix.
 */
export async function POST() {
  try {
    // Step 1: Fix the trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_daily_stats()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO daily_stats (website_id, date, page_views, unique_visitors, total_sessions, average_duration_seconds)
        VALUES 
          (NEW.website_id, NEW.visit_time::date, 1, 1, 1, NEW.duration_seconds)
        ON CONFLICT (website_id, date) DO UPDATE SET
          page_views = daily_stats.page_views + 1,
          unique_visitors = (
            SELECT COUNT(DISTINCT session_id) 
            FROM visitors 
            WHERE website_id = NEW.website_id AND visit_time::date = NEW.visit_time::date
          ),
          total_sessions = (
            SELECT COUNT(DISTINCT session_id) 
            FROM visitors 
            WHERE website_id = NEW.website_id AND visit_time::date = NEW.visit_time::date
          ),
          average_duration_seconds = (
            SELECT COALESCE(AVG(duration_seconds), 0)
            FROM visitors 
            WHERE website_id = NEW.website_id AND visit_time::date = NEW.visit_time::date
          ),
          updated_at = NOW();
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Step 2: Recalculate all daily_stats from scratch
    // First, truncate the existing (incorrect) daily_stats
    await query('TRUNCATE TABLE daily_stats');

    // Then rebuild from visitors table with correct aggregation
    await query(`
      INSERT INTO daily_stats (website_id, date, page_views, unique_visitors, total_sessions, average_duration_seconds)
      SELECT 
        website_id,
        visit_time::date as date,
        COUNT(*) as page_views,
        COUNT(DISTINCT session_id) as unique_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        COALESCE(AVG(duration_seconds), 0)::integer as average_duration_seconds
      FROM visitors
      GROUP BY website_id, visit_time::date
      ON CONFLICT (website_id, date) DO UPDATE SET
        page_views = EXCLUDED.page_views,
        unique_visitors = EXCLUDED.unique_visitors,
        total_sessions = EXCLUDED.total_sessions,
        average_duration_seconds = EXCLUDED.average_duration_seconds,
        updated_at = NOW()
    `);

    // Get summary of what was fixed
    const statsCount = await query('SELECT COUNT(*) as count FROM daily_stats');
    const totalCount = (statsCount[0] as { count: string })?.count || '0';

    return NextResponse.json({
      success: true,
      message: `Fixed trigger function and recalculated ${totalCount} daily_stats records`,
      details: {
        triggerFixed: true,
        statsRecalculated: parseInt(totalCount),
      }
    });

  } catch (error) {
    console.error('Error fixing stats:', error);
    return NextResponse.json(
      { error: 'Failed to fix stats', details: (error as Error).message },
      { status: 500 }
    );
  }
}
