import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';
import trekData from '../../../../../data/treks.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ratings/eligible - Get treks that user can rate (completed bookings)
export async function GET(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's completed bookings
    const { data: completedBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        trek_slug,
        status,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching completed bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch completed bookings' }, { status: 500 });
    }

    if (!completedBookings || completedBookings.length === 0) {
      return NextResponse.json({ 
        eligibleTreks: [],
        message: 'No completed treks found'
      });
    }

    // Get existing ratings by this user
    const { data: existingRatings, error: ratingsError } = await supabase
      .from('trek_ratings')
      .select('trek_id, booking_id')
      .eq('user_id', user.id);

    if (ratingsError) {
      console.error('Error fetching existing ratings:', ratingsError);
      return NextResponse.json({ error: 'Failed to fetch existing ratings' }, { status: 500 });
    }

    // Create a set of already rated booking IDs for quick lookup
    const ratedBookingIds = new Set(existingRatings?.map(r => r.booking_id) || []);

    // Get trek data from database for the completed bookings
    const trekSlugs = completedBookings.map(b => b.trek_slug);
    const { data: dbTreks, error: treksError } = await supabase
      .from('treks')
      .select('id, slug, name, image, region, difficulty, duration')
      .in('slug', trekSlugs);

    if (treksError) {
      console.error('Error fetching trek data:', treksError);
      return NextResponse.json({ error: 'Failed to fetch trek data' }, { status: 500 });
    }

    // Filter out already rated bookings and combine with JSON data
    const jsonTreks = (trekData as { treks: any[] }).treks;
    const eligibleTreks = completedBookings
      .filter(booking => !ratedBookingIds.has(booking.id))
      .map(booking => {
        // Get trek data from database first, then fallback to JSON
        const dbTrek = dbTreks?.find(t => t.slug === booking.trek_slug);
        const jsonTrek = jsonTreks.find(t => t.slug === booking.trek_slug);
        
        return {
          booking_id: booking.id,
          trek_id: dbTrek?.id || jsonTrek?.id,
          trek_slug: booking.trek_slug,
          trek_name: dbTrek?.name || jsonTrek?.name,
          trek_image: dbTrek?.image || jsonTrek?.image,
          trek_region: dbTrek?.region || jsonTrek?.region,
          trek_difficulty: dbTrek?.difficulty || jsonTrek?.difficulty,
          trek_duration: dbTrek?.duration || jsonTrek?.duration,
          completed_date: booking.created_at,
          can_rate: true
        };
      })
      .filter(trek => trek.trek_id); // Only include treks that exist

    return NextResponse.json({ 
      eligibleTreks,
      total: eligibleTreks.length,
      message: eligibleTreks.length > 0 
        ? `Found ${eligibleTreks.length} trek(s) that can be rated`
        : 'All completed treks have been rated'
    });

  } catch (error) {
    console.error('Error in ratings eligible GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
