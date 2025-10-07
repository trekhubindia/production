import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase environment variables' }, { status: 500 });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test 1: Check if treks table exists and has data
    const { data: treks, error: treksError } = await supabase
      .from('treks')
      .select('*')
      .limit(5);
    
    // Test 2: Check treks table for dynamic data (merged from trek_dynamic_data)
    const { data: treksWithDynamicData, error: dynamicError } = await supabase
      .from('treks')
      .select('slug, price, status, featured')
      .limit(5);
    
    // Test 3: Check a specific trek by slug
    const { data: specificTrek, error: specificError } = await supabase
      .from('treks')
      .select('*')
      .eq('slug', 'adi-kailash-om-parvat-trek')
      .single();
    
    return NextResponse.json({
      treks: treks || [],
      dynamicData: treksWithDynamicData || [],
      specificTrek: specificTrek || null,
      errors: {
        treks: treksError?.message,
        dynamic: dynamicError?.message,
        specific: specificError?.message
      }
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Database test failed', details: error }, { status: 500 });
  }
} 