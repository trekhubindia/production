import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const trek_slug = searchParams.get('trek_slug');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        trek_slug,
        question,
        answer,
        user_name,
        user_email,
        status,
        is_featured,
        answered_by,
        created_at,
        updated_at,
        answered_at,
        treks (
          name,
          slug
        )
      `, { count: 'exact' });

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (trek_slug) {
      query = query.eq('trek_slug', trek_slug);
    }

    // Apply pagination and ordering
    const { data: faqs, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching admin FAQs:', error);
      return NextResponse.json({ error: 'Failed to fetch FAQs' }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabaseAdmin
      .from('trek_faqs')
      .select('status')
      .then(({ data }) => {
        if (!data) return { data: null };
        
        const statusCounts = data.reduce((acc: Record<string, number>, faq) => {
          acc[faq.status] = (acc[faq.status] || 0) + 1;
          return acc;
        }, {});

        return {
          data: {
            total: data.length,
            pending: statusCounts.pending || 0,
            answered: statusCounts.answered || 0,
            hidden: statusCounts.hidden || 0
          }
        };
      });

    return NextResponse.json({
      faqs: faqs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: stats || { total: 0, pending: 0, answered: 0, hidden: 0 }
    });

  } catch (error) {
    console.error('Admin FAQs API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
