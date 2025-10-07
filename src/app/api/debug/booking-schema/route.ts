import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking booking table structure...');

    // Check if bookings table exists
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'bookings')
      .eq('table_schema', 'public')
      .single();

    console.log('🔍 Debug: Table exists check:', { exists: !!tableExists, error: tableError });

    if (!tableExists) {
      return NextResponse.json({
        error: 'Bookings table does not exist',
        tableExists: false
      });
    }

    // Get table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_name', 'bookings')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    console.log('🔍 Debug: Columns query result:', { 
      hasColumns: !!columns, 
      columnCount: columns?.length,
      error: columnsError 
    });

    if (columnsError) {
      return NextResponse.json({
        error: 'Failed to get table structure',
        details: columnsError.message
      });
    }

    // Try to get a sample booking to see the actual structure
    const { data: sampleBooking, error: sampleError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .limit(1);

    console.log('🔍 Debug: Sample booking query:', { 
      hasSample: !!sampleBooking, 
      sampleCount: sampleBooking?.length,
      error: sampleError 
    });

    return NextResponse.json({
      tableExists: true,
      columns: columns || [],
      sampleBooking: sampleBooking?.[0] || null,
      sampleError: sampleError?.message
    });

  } catch (error) {
    console.error('🔍 Debug: Booking schema check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 