import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ratings/stats - Get rating statistics for treks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trekId = searchParams.get('trek_id');
    const trekSlug = searchParams.get('trek_slug');

    if (!trekId && !trekSlug) {
      return NextResponse.json({ 
        error: 'Either trek_id or trek_slug is required' 
      }, { status: 400 });
    }

    // Get rating statistics using the view
    let query = supabase
      .from('trek_rating_stats')
      .select('*');

    if (trekId) {
      query = query.eq('trek_id', trekId);
    } else if (trekSlug) {
      query = query.eq('trek_slug', trekSlug);
    }

    const { data: stats, error } = await query.single();

    if (error) {
      console.error('Error fetching rating stats:', error);
      return NextResponse.json({ error: 'Failed to fetch rating statistics' }, { status: 500 });
    }

    // If no stats found, return default values
    if (!stats) {
      return NextResponse.json({
        trek_id: trekId,
        trek_slug: trekSlug,
        total_ratings: 0,
        average_rating: 0,
        average_difficulty: 0,
        average_guide_rating: 0,
        average_value_rating: 0,
        average_organization_rating: 0,
        five_star_count: 0,
        four_star_count: 0,
        three_star_count: 0,
        two_star_count: 0,
        one_star_count: 0,
        recommend_count: 0,
        recommend_percentage: 0
      });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in rating stats GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
