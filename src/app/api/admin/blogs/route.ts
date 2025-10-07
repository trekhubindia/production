import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTableOfContents, addIdsToContent } from '@/lib/generateTOC';
import { sendNewsletterInBackground, shouldSendNewsletter } from '@/lib/auto-newsletter';

// GET - Fetch all blogs
export async function GET() {
  try {
    const { data: blogs, error } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blogs:', error);
      return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 });
    }

    return NextResponse.json({ blogs });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new blog
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, slug, summary, content, image, author, category, read_time, status = 'draft' } = body;

    // Validate required fields
    if (!title || !slug || !summary) {
      return NextResponse.json({ error: 'Title, slug, and summary are required' }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existingBlog } = await supabaseAdmin
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBlog) {
      return NextResponse.json({ error: 'Blog with this slug already exists' }, { status: 400 });
    }

    // Generate Table of Contents from content
    const tocItems = generateTableOfContents(content || '');
    const contentWithIds = addIdsToContent(content || '', tocItems);

    // Create new blog
    const { data: blog, error } = await supabaseAdmin
      .from('blogs')
      .insert({
        title,
        slug,
        summary,
        content: contentWithIds,
        image,
        author,
        category,
        read_time,
        status,
        table_of_contents: JSON.stringify(tocItems),
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog:', error);
      return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 });
    }

    // Send automatic newsletter if blog is published
    if (shouldSendNewsletter(undefined, status)) {
      console.log(`🚀 Triggering automatic newsletter for new published blog: ${blog.title}`);
      sendNewsletterInBackground({
        id: blog.id,
        title: blog.title,
        slug: blog.slug,
        summary: blog.summary,
        status: blog.status
      });
    }

    return NextResponse.json({ 
      blog,
      newsletter: status === 'published' ? 'Newsletter will be sent automatically' : undefined
    }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 