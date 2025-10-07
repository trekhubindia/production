import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const featured = searchParams.get('featured') === 'true';
    const trek_slug = searchParams.get('trek_slug');

    // Build query for public FAQs (only approved and answered)
    let query = supabase
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_featured,
        is_anonymous,
        upvotes,
        downvotes,
        category,
        created_at,
        user_id,
        trek_id
      `)
      .eq('is_approved', true)
      .eq('is_answered', true)
      .not('answer', 'is', null);

    // Filter by featured if requested
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Filter by trek if specified
    if (trek_slug) {
      // First get the trek ID from slug
      const { data: trek } = await supabase
        .from('treks')
        .select('id')
        .eq('slug', trek_slug)
        .single();
      
      if (trek) {
        query = query.eq('trek_id', trek.id);
      }
    }

    // Apply ordering and limit
    const { data: faqs, error } = await query
      .order('is_featured', { ascending: false }) // Featured first
      .order('created_at', { ascending: false }) // Then by newest
      .limit(limit);

    if (error) {
      console.error('Error fetching public FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    // Get user profiles for non-anonymous FAQs
    const userIds = faqs?.filter(faq => !faq.is_anonymous).map(faq => faq.user_id) || [];
    const trekIds = faqs?.map(faq => faq.trek_id) || [];
    
    let userProfiles: any[] = [];
    let treks: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name')
        .in('user_id', userIds);
      userProfiles = profiles || [];
    }
    
    if (trekIds.length > 0) {
      const { data: trekData } = await supabase
        .from('treks')
        .select('id, name, slug')
        .in('id', trekIds);
      treks = trekData || [];
    }

    // Transform data for frontend
    const transformedFaqs = (faqs || []).map(faq => {
      const userProfile = userProfiles.find(p => p.user_id === faq.user_id);
      const trek = treks.find(t => t.id === faq.trek_id);
      
      return {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        is_featured: faq.is_featured,
        is_anonymous: faq.is_anonymous,
        upvotes: faq.upvotes,
        downvotes: faq.downvotes,
        category: faq.category,
        created_at: faq.created_at,
        user_name: faq.is_anonymous ? 'Anonymous' : (userProfile?.name || 'Unknown User'),
        trek_name: trek?.name || null,
        trek_slug: trek?.slug || null
      };
    });

    return NextResponse.json({
      faqs: transformedFaqs,
      total: transformedFaqs.length
    });

  } catch (error) {
    console.error('Public FAQs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/faqs - Create a new FAQ question (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { trek_id, question, is_anonymous = false, category = 'general' } = body;

    // Validate required fields
    if (!trek_id || !question) {
      return NextResponse.json({ 
        error: 'Missing required fields: trek_id, question' 
      }, { status: 400 });
    }

    // Validate question length
    if (question.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Question must be at least 10 characters long' 
      }, { status: 400 });
    }

    // Check if trek exists
    const { data: trek } = await supabase
      .from('treks')
      .select('id, name')
      .eq('id', trek_id)
      .single();

    if (!trek) {
      return NextResponse.json({ 
        error: 'Trek not found' 
      }, { status: 404 });
    }

    // Create the FAQ
    const { data: newFAQ, error: insertError } = await supabase
      .from('trek_faqs')
      .insert({
        trek_id,
        user_id: user.id,
        question: question.trim(),
        is_anonymous,
        category,
        is_approved: false, // Requires admin approval
        is_answered: false
      })
      .select(`
        id,
        question,
        is_anonymous,
        category,
        created_at,
        treks:trek_id (
          id,
          name,
          slug
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating FAQ:', insertError);
      return NextResponse.json({ error: 'Failed to create FAQ' }, { status: 500 });
    }

    return NextResponse.json({ 
      faq: newFAQ,
      message: 'Question submitted successfully! It will be reviewed and answered by our team.'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in FAQ POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
