import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTableOfContents, addIdsToContent } from '@/lib/generateTOC';
import { sendNewsletterInBackground, shouldSendNewsletter } from '@/lib/auto-newsletter';

// GET - Fetch single blog
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: blog, error } = await supabaseAdmin
      .from('blogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching blog:', error);
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ blog });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update blog
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, slug, summary, content, image, author, category, read_time, status } = body;

    // Validate required fields
    if (!title || !slug || !summary) {
      return NextResponse.json({ error: 'Title, slug, and summary are required' }, { status: 400 });
    }

    // Get current blog to check status change
    const { data: currentBlog, error: currentBlogError } = await supabaseAdmin
      .from('blogs')
      .select('status')
      .eq('id', id)
      .single();

    if (currentBlogError) {
      console.error('Error fetching current blog:', currentBlogError);
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Check if slug already exists for other blogs
    const { data: existingBlog } = await supabaseAdmin
      .from('blogs')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingBlog) {
      return NextResponse.json({ error: 'Blog with this slug already exists' }, { status: 400 });
    }

    // Generate Table of Contents from content
    const tocItems = generateTableOfContents(content || '');
    const contentWithIds = addIdsToContent(content || '', tocItems);

    // Update blog
    const { data: blog, error } = await supabaseAdmin
      .from('blogs')
      .update({
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
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog:', error);
      return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 });
    }

    // Send automatic newsletter if status changed to published
    if (shouldSendNewsletter(currentBlog.status, status)) {
      console.log(`🚀 Triggering automatic newsletter for published blog: ${blog.title}`);
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
      newsletter: shouldSendNewsletter(currentBlog.status, status) ? 'Newsletter will be sent automatically' : undefined
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete blog
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog:', error);
      return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 