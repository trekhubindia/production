import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Cache for slots data (in-memory cache for better performance)
const slotsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// GET /api/slots?trek_slug=... (OPTIMIZED WITH CACHING)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trekSlug = searchParams.get('trek_slug');
    
    if (!trekSlug) {
      return NextResponse.json({ error: 'trek_slug is required' }, { status: 400 });
    }

    // Check cache first
    const cached = slotsCache.get(trekSlug);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      });
    }

    // Get slots by trek_slug (now available in trek_slots table)
    const { data: slots, error } = await supabaseAdmin
      .from('trek_slots')
      .select('*')
      .eq('trek_slug', trekSlug)
      .order('date');

    console.log('🔍 Debug: Slots query result:', { 
      trekSlug,
      hasSlots: !!slots, 
      slotsCount: slots?.length,
      error: error?.message 
    });

    if (error) {
      console.error('🔍 Debug: Error fetching slots:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch slots', 
        details: error.message,
        slots: []
      }, { status: 500 });
    }

    // Calculate dynamic booked counts for each slot
    const slotsWithDynamicCounts = await Promise.all(
      (slots || []).map(async (slot) => {
        const { data: bookings, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .select('participants')
          .eq('slot_id', slot.id)
          .in('status', ['confirmed', 'pending']); // Count confirmed and pending bookings

        if (bookingError) {
          console.error('Error fetching bookings for slot:', slot.id, bookingError);
          return { ...slot, dynamicBooked: slot.booked || 0 }; // Use existing booked count as fallback
        }

        const dynamicBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;
        
        return {
          ...slot,
          booked: dynamicBooked, // Override with dynamic count
          dynamicBooked,
          available: Math.max(0, slot.capacity - dynamicBooked)
        };
      })
    );

    // Filter for available slots only
    const availableSlots = slotsWithDynamicCounts.filter(slot => 
      slot.status === 'open' && slot.available > 0
    );

    const responseData = { 
      slots: availableSlots,
      allSlots: slotsWithDynamicCounts,
      totalSlots: slotsWithDynamicCounts.length,
      availableSlots: availableSlots.length
    };

    // Cache the response
    slotsCache.set(trekSlug, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error('🔍 Debug: Slots API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      slots: []
    }, { status: 500 });
  }
}

// POST /api/slots (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trek_slug, date, capacity, status } = body;
    
    console.log('🔍 Debug: Creating slot:', { trek_slug, date, capacity, status });
    
    if (!trek_slug || !date || !capacity) {
      return NextResponse.json({ error: 'trek_slug, date, and capacity are required' }, { status: 400 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('trek_slots')
      .insert({ trek_slug, date, capacity, status: status || 'open' })
      .select()
      .single();
      
    if (error) {
      console.error('🔍 Debug: Error creating slot:', error);
      return NextResponse.json({ error: 'Failed to create slot', details: error.message }, { status: 500 });
    }
    
    console.log('🔍 Debug: Slot created successfully:', data);
    return NextResponse.json({ slot: data }, { status: 201 });
  } catch (error) {
    console.error('🔍 Debug: Create slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PATCH /api/slots?id=... (admin only)
export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    const body = await req.json();
    const { capacity, date, status } = body;
    
    console.log('🔍 Debug: Updating slot:', { id, capacity, date, status });
    
    const update: Record<string, unknown> = {};
    if (capacity !== undefined) update.capacity = capacity;
    if (date !== undefined) update.date = date;
    if (status !== undefined) update.status = status;
    
    const { data, error } = await supabaseAdmin
      .from('trek_slots')
      .update(update)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('🔍 Debug: Error updating slot:', error);
      return NextResponse.json({ error: 'Failed to update slot', details: error.message }, { status: 500 });
    }
    
    console.log('🔍 Debug: Slot updated successfully:', data);
    return NextResponse.json({ slot: data }, { status: 200 });
  } catch (error) {
    console.error('🔍 Debug: Update slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// DELETE /api/slots?id=... (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    
    console.log('🔍 Debug: Deleting slot:', id);
    
    const { error } = await supabaseAdmin
      .from('trek_slots')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('🔍 Debug: Error deleting slot:', error);
      return NextResponse.json({ error: 'Failed to delete slot', details: error.message }, { status: 500 });
    }
    
    console.log('🔍 Debug: Slot deleted successfully');
    return NextResponse.json({ message: 'Slot deleted' }, { status: 200 });
  } catch (error) {
    console.error('🔍 Debug: Delete slot error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 