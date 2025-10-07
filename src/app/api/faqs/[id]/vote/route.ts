import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/faqs/[id]/vote - Vote on an FAQ
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { vote_type } = body;
    const { id } = await params;
    const faqId = id;

    if (!vote_type || !['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json({ 
        error: 'Invalid vote type. Must be "upvote" or "downvote"' 
      }, { status: 400 });
    }

    // Check if FAQ exists
    const { data: faq } = await supabase
      .from('trek_faqs')
      .select('id, upvotes, downvotes')
      .eq('id', faqId)
      .single();

    if (!faq) {
      return NextResponse.json({ 
        error: 'FAQ not found' 
      }, { status: 404 });
    }

    // Check if user already voted
    const { data: existingVote } = await supabase
      .from('faq_votes')
      .select('id, vote_type')
      .eq('faq_id', faqId)
      .eq('user_id', user.id)
      .single();

    if (existingVote) {
      if (existingVote.vote_type === vote_type) {
        // Same vote type - remove the vote
        const { error: deleteError } = await supabase
          .from('faq_votes')
          .delete()
          .eq('id', existingVote.id);

        if (deleteError) {
          console.error('Error removing vote:', deleteError);
          return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
        }
      } else {
        // Different vote type - update the vote
        const { error: updateError } = await supabase
          .from('faq_votes')
          .update({ vote_type })
          .eq('id', existingVote.id);

        if (updateError) {
          console.error('Error updating vote:', updateError);
          return NextResponse.json({ error: 'Failed to update vote' }, { status: 500 });
        }
      }
    } else {
      // No existing vote - create new vote
      const { error: insertError } = await supabase
        .from('faq_votes')
        .insert({
          faq_id: faqId,
          user_id: user.id,
          vote_type
        });

      if (insertError) {
        console.error('Error creating vote:', insertError);
        return NextResponse.json({ error: 'Failed to create vote' }, { status: 500 });
      }
    }

    // Get updated vote counts
    const { data: updatedFaq } = await supabase
      .from('trek_faqs')
      .select('upvotes, downvotes')
      .eq('id', faqId)
      .single();

    return NextResponse.json({
      upvotes: updatedFaq?.upvotes || 0,
      downvotes: updatedFaq?.downvotes || 0,
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('Error in FAQ vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/faqs/[id]/vote - Remove vote from FAQ
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const faqId = id;

    // Remove user's vote
    const { error: deleteError } = await supabase
      .from('faq_votes')
      .delete()
      .eq('faq_id', faqId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error removing vote:', deleteError);
      return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 });
    }

    // Get updated vote counts
    const { data: updatedFaq } = await supabase
      .from('trek_faqs')
      .select('upvotes, downvotes')
      .eq('id', faqId)
      .single();

    return NextResponse.json({
      upvotes: updatedFaq?.upvotes || 0,
      downvotes: updatedFaq?.downvotes || 0,
      message: 'Vote removed successfully'
    });

  } catch (error) {
    console.error('Error removing FAQ vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
