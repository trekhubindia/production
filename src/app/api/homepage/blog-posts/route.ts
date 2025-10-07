import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if blogs table exists
    const { error: tableError } = await supabase
      .from('blogs')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, return empty array
      return NextResponse.json({ blogPosts: [] });
    }

    if (tableError) {
      console.error('Error checking blogs table:', tableError);
      return NextResponse.json({ blogPosts: [] });
    }

    // Fetch published blogs from the blogs table
    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('id, title, summary, image, author, created_at, category, read_time, status, slug')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching blogs:', error);
      return NextResponse.json({ blogPosts: [] });
    }

    // Transform the data to match the expected interface
    const blogPosts = (blogs || []).map(blog => ({
      id: blog.id,
      title: blog.title,
      excerpt: blog.summary,
      content: blog.summary, // Using summary as content for now
      author: blog.author || 'Expert Guide Team',
      publishedAt: blog.created_at,
      image: blog.image || '/images/valley-flowers-summer.jpg',
      slug: blog.slug,
      category: blog.category,
      read_time: blog.read_time
    }));

    return NextResponse.json({ blogPosts });
  } catch (error) {
    console.error('Unexpected error in blog posts API:', error);
    return NextResponse.json({ blogPosts: [] });
  }
} 