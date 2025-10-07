import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trekSlug = searchParams.get('trek_slug') || 'adi-kailash-om-parvat-trek';
    
    console.log('🔍 Test: Checking database state for trek_slug:', trekSlug);
    
    // Check if trek_slots table exists
    const { data: tableExists, error: tableError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'trek_slots')
      .eq('table_schema', 'public')
      .single();

    console.log('🔍 Test: Table exists check:', { tableExists, tableError });

    if (!tableExists) {
      return NextResponse.json({ 
        error: 'trek_slots table does not exist',
        tableExists: false
      }, { status: 500 });
    }

    // Get all slots for the trek
    const { data: allSlots, error: slotsError } = await supabaseAdmin
      .from('trek_slots')
      .select('*')
      .eq('trek_slug', trekSlug)
      .order('date');

    console.log('🔍 Test: All slots query:', { 
      trekSlug,
      allSlots,
      slotsError,
      count: allSlots?.length
    });

    // Get available slots (open status and capacity > booked)
    const { data: availableSlots, error: availableError } = await supabaseAdmin
      .from('trek_slots')
      .select('*')
      .eq('trek_slug', trekSlug)
      .eq('status', 'open')
      .order('date');

    console.log('🔍 Test: Available slots query:', { 
      availableSlots,
      availableError,
      count: availableSlots?.length
    });

    // Check if there are any slots with capacity > booked
    const slotsWithSpace = availableSlots?.filter(slot => 
      slot.capacity > slot.booked
    ) || [];

    console.log('🔍 Test: Slots with space:', { 
      slotsWithSpace,
      count: slotsWithSpace.length
    });

    return NextResponse.json({ 
      tableExists: true,
      allSlots: allSlots || [],
      availableSlots: availableSlots || [],
      slotsWithSpace: slotsWithSpace,
      totalSlots: allSlots?.length || 0,
      availableCount: availableSlots?.length || 0,
      withSpaceCount: slotsWithSpace.length
    }, { status: 200 });
  } catch (error) {
    console.error('🔍 Test: Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 