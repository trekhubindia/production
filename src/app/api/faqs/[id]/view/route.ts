import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/faqs/[id]/view - Increment view count for FAQ
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: faqId } = await params;

    // Check if FAQ exists
    const { data: faq } = await supabase
      .from('trek_faqs')
      .select('id, views')
      .eq('id', faqId)
      .single();

    if (!faq) {
      return NextResponse.json({ 
        error: 'FAQ not found' 
      }, { status: 404 });
    }

    // Increment view count using the database function
    const { error } = await supabase.rpc('increment_faq_views', {
      faq_uuid: faqId
    });

    if (error) {
      console.error('Error incrementing view count:', error);
      return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 });
    }

    return NextResponse.json({
      views: faq.views + 1,
      message: 'View count incremented'
    });

  } catch (error) {
    console.error('Error in FAQ view increment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
