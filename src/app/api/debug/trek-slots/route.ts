import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trekSlug = searchParams.get('trek_slug');

    console.log('🔍 Debug: Checking trek_slots data...');

    // Check if trek_slots table exists
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'trek_slots')
      .eq('table_schema', 'public')
      .single();

    console.log('🔍 Debug: Table exists check:', { exists: !!tableExists, error: tableError });

    if (!tableExists) {
      return NextResponse.json({
        error: 'trek_slots table does not exist',
        tableExists: false
      });
    }

    // Get table structure
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_name', 'trek_slots')
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

    // Get all slots or filter by trek_slug
    let slotsQuery = supabaseAdmin
      .from('trek_slots')
      .select('*')
      .order('date');

    if (trekSlug) {
      slotsQuery = slotsQuery.eq('trek_slug', trekSlug);
    }

    const { data: slots, error: slotsError } = await slotsQuery;

    console.log('🔍 Debug: Slots query result:', { 
      hasSlots: !!slots, 
      slotsCount: slots?.length,
      error: slotsError 
    });

    if (slotsError) {
      return NextResponse.json({
        error: 'Failed to fetch slots',
        details: slotsError.message
      });
    }

    // Get unique trek_slugs
    const { data: uniqueSlugs } = await supabaseAdmin
      .from('trek_slots')
      .select('trek_slug')
      .order('trek_slug');

    const uniqueSlugList = [...new Set(uniqueSlugs?.map(s => s.trek_slug) || [])];

    return NextResponse.json({
      tableExists: true,
      columns: columns || [],
      slots: slots || [],
      uniqueTrekSlugs: uniqueSlugList,
      totalSlots: slots?.length || 0,
      requestedSlug: trekSlug,
      slotsError: slotsError?.message
    });

  } catch (error) {
    console.error('🔍 Debug: Trek slots check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 