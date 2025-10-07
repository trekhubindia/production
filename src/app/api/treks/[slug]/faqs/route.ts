import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateRequest } from '@/lib/lucia';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // First get the trek ID from slug
    const { data: trek } = await supabase
      .from('treks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!trek) {
      return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Get trek-specific FAQs that are approved and answered
    const { data: faqs, error } = await supabase
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_anonymous,
        is_featured,
        upvotes,
        downvotes,
        category,
        created_at,
        answered_at,
        user_id,
        answered_by
      `)
      .eq('trek_id', trek.id)
      .eq('is_approved', true)
      .eq('is_answered', true)
      .not('answer', 'is', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trek FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    // Get user profiles for non-anonymous FAQs
    const userIds = faqs?.filter(faq => !faq.is_anonymous).map(faq => faq.user_id) || [];
    const answererIds = faqs?.filter(faq => faq.answered_by).map(faq => faq.answered_by) || [];
    const allUserIds = [...new Set([...userIds, ...answererIds])];

    let userProfiles: any[] = [];
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name')
        .in('user_id', allUserIds);
      userProfiles = profiles || [];
    }

    // Transform data to match expected FAQ format
    const transformedFaqs = (faqs || []).map(faq => {
      const userProfile = userProfiles.find(p => p.user_id === faq.user_id);
      const answererProfile = userProfiles.find(p => p.user_id === faq.answered_by);
      
      return {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        is_anonymous: faq.is_anonymous,
        is_featured: faq.is_featured,
        upvotes: faq.upvotes,
        downvotes: faq.downvotes,
        category: faq.category,
        created_at: faq.created_at,
        answered_at: faq.answered_at,
        user_name: faq.is_anonymous ? 'Anonymous' : (userProfile?.name || 'Anonymous'),
        answerer_name: answererProfile?.name || 'Admin Team',
        // Legacy field names for compatibility with existing components
        createdAt: faq.created_at,
        answeredAt: faq.answered_at,
        author: faq.is_anonymous ? 'Anonymous' : (userProfile?.name || 'Anonymous'),
        answeredBy: answererProfile?.name || 'Admin Team',
        featured: faq.is_featured
      };
    });

    return NextResponse.json({
      faqs: transformedFaqs,
      count: transformedFaqs.length
    });

  } catch (error) {
    console.error('Trek FAQs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { user, session } = await validateRequest();
    
    if (!user || !session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { question, is_anonymous = false, category = 'general' } = body;

    if (!question || question.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Question must be at least 10 characters long' 
      }, { status: 400 });
    }

    // Get trek_id from slug
    const { data: trek, error: trekError } = await supabase
      .from('treks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (trekError || !trek) {
      return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Create new FAQ
    const { data: newFaq, error: insertError } = await supabase
      .from('trek_faqs')
      .insert({
        trek_id: trek.id,
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
        created_at
      `)
      .single();

    if (insertError) {
      console.error('Error creating FAQ:', insertError);
      return NextResponse.json({ error: 'Failed to submit question' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Question submitted successfully! It will be reviewed and answered by our team.',
      faq: newFaq
    });

  } catch (error) {
    console.error('Submit FAQ error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
