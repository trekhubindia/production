import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if partners table exists
    const { error: tableError } = await supabase
      .from('partners')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, return empty array
      return NextResponse.json({ partners: [] });
    }

    if (tableError) {
      console.error('Error checking partners table:', tableError);
      return NextResponse.json({ partners: [] });
    }

    const { data: partners, error } = await supabase
      .from('partners')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json({ partners: [] });
    }

    return NextResponse.json({ partners: partners || [] });
  } catch (error) {
    console.error('Unexpected error in partners API:', error);
    return NextResponse.json({ partners: [] });
  }
} 