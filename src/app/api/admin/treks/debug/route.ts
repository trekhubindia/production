import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if trek_dynamic_data table exists and get its structure
    const { error: tableError } = await supabase
      .from('trek_dynamic_data')
      .select('*')
      .limit(1);

    // Check if trek_slots table exists
    const { data: slotsInfo, error: slotsError } = await supabase
      .from('trek_slots')
      .select('*')
      .limit(1);

    // Get sample data from trek_dynamic_data
    const { data: sampleData, error: sampleError } = await supabase
      .from('trek_dynamic_data')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      debug: {
        trek_dynamic_data: {
          exists: !tableError,
          error: tableError?.message,
          sampleData: sampleData || [],
          sampleError: sampleError?.message
        },
        trek_slots: {
          exists: !slotsError,
          error: slotsError?.message,
          sampleData: slotsInfo || []
        },
        environment: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 