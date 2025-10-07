import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/ratings - Get ratings for a trek or user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trekId = searchParams.get('trek_id');
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('trek_ratings')
      .select(`
        *,
        auth_user:user_id (
          id,
          email
        ),
        treks:trek_id (
          id,
          slug,
          name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (trekId) {
      query = query.eq('trek_id', trekId);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: ratings, error } = await query;

    if (error) {
      console.error('Error fetching ratings:', error);
      return NextResponse.json({ error: 'Failed to fetch ratings' }, { status: 500 });
    }

    return NextResponse.json({ 
      ratings: ratings || [],
      total: ratings?.length || 0
    });
  } catch (error) {
    console.error('Error in ratings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/ratings - Create a new rating (only for completed treks)
export async function POST(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      trek_id, 
      booking_id, 
      rating, 
      review,
      difficulty_rating,
      guide_rating,
      value_rating,
      organization_rating,
      would_recommend = true,
      trek_date
    } = body;

    // Validate required fields
    if (!trek_id || !booking_id || !rating) {
      return NextResponse.json({ 
        error: 'Missing required fields: trek_id, booking_id, rating' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if user can rate this trek (must have completed booking)
    const { data: canRate, error: canRateError } = await supabase
      .rpc('can_user_rate_trek', {
        p_user_id: user.id,
        p_trek_id: trek_id,
        p_booking_id: booking_id
      });

    if (canRateError) {
      console.error('Error checking rating eligibility:', canRateError);
      return NextResponse.json({ error: 'Failed to verify rating eligibility' }, { status: 500 });
    }

    if (!canRate) {
      return NextResponse.json({ 
        error: 'You can only rate treks that you have completed' 
      }, { status: 403 });
    }

    // Check if user has already rated this trek for this booking
    const { data: existingRating } = await supabase
      .from('trek_ratings')
      .select('id')
      .eq('user_id', user.id)
      .eq('trek_id', trek_id)
      .eq('booking_id', booking_id)
      .single();

    if (existingRating) {
      return NextResponse.json({ 
        error: 'You have already rated this trek' 
      }, { status: 409 });
    }

    // Create the rating
    const { data: newRating, error: insertError } = await supabase
      .from('trek_ratings')
      .insert({
        user_id: user.id,
        trek_id,
        booking_id,
        rating,
        review: review || null,
        difficulty_rating: difficulty_rating || null,
        guide_rating: guide_rating || null,
        value_rating: value_rating || null,
        organization_rating: organization_rating || null,
        would_recommend,
        trek_date: trek_date || null
      })
      .select(`
        *,
        auth_user:user_id (
          id,
          email
        ),
        treks:trek_id (
          id,
          slug,
          name
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating rating:', insertError);
      return NextResponse.json({ error: 'Failed to create rating' }, { status: 500 });
    }

    return NextResponse.json({ 
      rating: newRating,
      message: 'Rating created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in ratings POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/ratings - Update an existing rating
export async function PUT(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      rating_id, 
      rating, 
      review,
      difficulty_rating,
      guide_rating,
      value_rating,
      organization_rating,
      would_recommend,
      trek_date
    } = body;

    // Validate required fields
    if (!rating_id || !rating) {
      return NextResponse.json({ 
        error: 'Missing required fields: rating_id, rating' 
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ 
        error: 'Rating must be between 1 and 5' 
      }, { status: 400 });
    }

    // Check if rating exists and belongs to user
    const { data: existingRating } = await supabase
      .from('trek_ratings')
      .select('*')
      .eq('id', rating_id)
      .eq('user_id', user.id)
      .single();

    if (!existingRating) {
      return NextResponse.json({ 
        error: 'Rating not found or you do not have permission to update it' 
      }, { status: 404 });
    }

    // Update the rating
    const { data: updatedRating, error: updateError } = await supabase
      .from('trek_ratings')
      .update({
        rating,
        review: review || null,
        difficulty_rating: difficulty_rating || null,
        guide_rating: guide_rating || null,
        value_rating: value_rating || null,
        organization_rating: organization_rating || null,
        would_recommend: would_recommend !== undefined ? would_recommend : existingRating.would_recommend,
        trek_date: trek_date || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rating_id)
      .select(`
        *,
        auth_user:user_id (
          id,
          email
        ),
        treks:trek_id (
          id,
          slug,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating rating:', updateError);
      return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
    }

    return NextResponse.json({ 
      rating: updatedRating,
      message: 'Rating updated successfully'
    });

  } catch (error) {
    console.error('Error in ratings PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
