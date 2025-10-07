import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if gallery_photos table exists
    const { error: tableError } = await supabase
      .from('gallery_photos')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, return empty array
      return NextResponse.json({ galleryPhotos: [] });
    }

    if (tableError) {
      console.error('Error checking gallery_photos table:', tableError);
      return NextResponse.json({ galleryPhotos: [] });
    }

    const { data: galleryPhotos, error } = await supabase
      .from('gallery_photos')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching gallery photos:', error);
      return NextResponse.json({ galleryPhotos: [] });
    }

    return NextResponse.json({ galleryPhotos: galleryPhotos || [] });
  } catch (error) {
    console.error('Unexpected error in gallery API:', error);
    return NextResponse.json({ galleryPhotos: [] });
  }
} 