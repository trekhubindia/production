import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if trek_leaders table exists
    const { error: tableError } = await supabase
      .from('trek_leaders')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, return empty array
      return NextResponse.json({ trekLeaders: [] });
    }

    if (tableError) {
      console.error('Error checking trek_leaders table:', tableError);
      return NextResponse.json({ trekLeaders: [] });
    }

    const { data: trekLeaders, error } = await supabase
      .from('trek_leaders')
      .select('*')
      .order('experience_years', { ascending: false });

    if (error) {
      console.error('Error fetching trek leaders:', error);
      return NextResponse.json({ trekLeaders: [] });
    }

    return NextResponse.json({ trekLeaders: trekLeaders || [] });
  } catch (error) {
    console.error('Unexpected error in trek leaders API:', error);
    return NextResponse.json({ trekLeaders: [] });
  }
} 