import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const minRating = parseInt(searchParams.get('min_rating') || '4');

    // Fetch real reviews from the database
    const { data: reviews, error } = await supabaseAdmin
      .from('trek_ratings')
      .select(`
        id,
        rating,
        review_title,
        review_text,
        created_at,
        verified_booking,
        helpful_count,
        auth_user!inner (
          id,
          email
        ),
        treks!inner (
          id,
          name,
          slug
        ),
        bookings!inner (
          id,
          customer_name,
          customer_email
        )
      `)
      .eq('verified_booking', true)
      .gte('rating', minRating)
      .not('review_text', 'is', null)
      .not('review_text', 'eq', '')
      .order('helpful_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Transform the data to match the testimonials format
    const testimonials = reviews?.map((review: any) => {
      // Extract customer name from booking or use email prefix
      const customerName = review.bookings?.customer_name || 
                          review.auth_user?.email?.split('@')[0] || 
                          'Anonymous Trekker';
      
      // Format date
      const reviewDate = new Date(review.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      // Determine badge based on rating and helpful count
      let badge = 'Verified Trekker';
      if (review.helpful_count > 10) badge = 'Top Reviewer';
      else if (review.rating === 5) badge = 'Five Star Trekker';
      else if (review.verified_booking) badge = 'Verified Trekker';

      return {
        id: review.id,
        name: customerName,
        location: 'India', // Default location, could be enhanced with user profiles
        trek: review.treks?.name || 'Himalayan Trek',
        rating: review.rating,
        review: review.review_text,
        title: review.review_title,
        date: reviewDate,
        badge: badge,
        helpful_count: review.helpful_count,
        verified: review.verified_booking
      };
    }) || [];

    // If no real reviews found, return a message
    if (testimonials.length === 0) {
      return NextResponse.json({
        testimonials: [],
        message: 'No reviews found matching criteria',
        fallback: true
      });
    }

    return NextResponse.json({
      testimonials,
      total: testimonials.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to add helpful vote to a review
export async function POST(request: NextRequest) {
  try {
    const { reviewId } = await request.json();

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    // First get current helpful count, then increment it
    const { data: currentData, error: fetchError } = await supabaseAdmin
      .from('trek_ratings')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    if (fetchError) {
      console.error('Error fetching current helpful count:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch current count' }, { status: 500 });
    }

    // Increment helpful count
    const { data, error } = await supabaseAdmin
      .from('trek_ratings')
      .update({ 
        helpful_count: (currentData.helpful_count || 0) + 1
      })
      .eq('id', reviewId)
      .select('helpful_count')
      .single();

    if (error) {
      console.error('Error updating helpful count:', error);
      return NextResponse.json({ error: 'Failed to update helpful count' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      helpful_count: data.helpful_count
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
