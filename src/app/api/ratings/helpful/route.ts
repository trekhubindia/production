import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/ratings/helpful - Mark a rating as helpful
export async function POST(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { rating_id } = body;

    if (!rating_id) {
      return NextResponse.json({ 
        error: 'Missing required field: rating_id' 
      }, { status: 400 });
    }

    // Check if rating exists
    const { data: rating } = await supabase
      .from('trek_ratings')
      .select('id')
      .eq('id', rating_id)
      .single();

    if (!rating) {
      return NextResponse.json({ 
        error: 'Rating not found' 
      }, { status: 404 });
    }

    // Check if user already marked this as helpful
    const { data: existingHelpful } = await supabase
      .from('rating_helpful')
      .select('id')
      .eq('rating_id', rating_id)
      .eq('user_id', user.id)
      .single();

    if (existingHelpful) {
      return NextResponse.json({ 
        error: 'You have already marked this rating as helpful' 
      }, { status: 409 });
    }

    // Add helpful vote
    const { data: helpful, error: insertError } = await supabase
      .from('rating_helpful')
      .insert({
        rating_id,
        user_id: user.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error adding helpful vote:', insertError);
      return NextResponse.json({ error: 'Failed to add helpful vote' }, { status: 500 });
    }

    // Get updated helpful count
    const { data: updatedRating } = await supabase
      .from('trek_ratings')
      .select('helpful_count')
      .eq('id', rating_id)
      .single();

    return NextResponse.json({ 
      helpful: helpful,
      helpful_count: updatedRating?.helpful_count || 0,
      message: 'Rating marked as helpful'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in helpful POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/ratings/helpful - Remove helpful vote
export async function DELETE(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ratingId = searchParams.get('rating_id');

    if (!ratingId) {
      return NextResponse.json({ 
        error: 'Missing required parameter: rating_id' 
      }, { status: 400 });
    }

    // Remove helpful vote
    const { error: deleteError } = await supabase
      .from('rating_helpful')
      .delete()
      .eq('rating_id', ratingId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing helpful vote:', deleteError);
      return NextResponse.json({ error: 'Failed to remove helpful vote' }, { status: 500 });
    }

    // Get updated helpful count
    const { data: updatedRating } = await supabase
      .from('trek_ratings')
      .select('helpful_count')
      .eq('id', ratingId)
      .single();

    return NextResponse.json({ 
      helpful_count: updatedRating?.helpful_count || 0,
      message: 'Helpful vote removed'
    });

  } catch (error) {
    console.error('Error in helpful DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
