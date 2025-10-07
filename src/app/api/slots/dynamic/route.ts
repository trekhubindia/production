import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/slots/dynamic?trek_slug=... - Get slots with dynamic booked counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const trekSlug = searchParams.get('trek_slug');
    
    console.log('🔍 Debug: Fetching dynamic slots for trek_slug:', trekSlug);
    
    if (!trekSlug) {
      return NextResponse.json({ error: 'trek_slug is required' }, { status: 400 });
    }

    // Get slots with dynamic booked counts by joining with bookings
    const { data: slotsWithBookings, error } = await supabaseAdmin
      .from('trek_slots')
      .select(`
        *,
        bookings!inner(
          participants,
          status
        )
      `)
      .eq('trek_slug', trekSlug)
      .order('date');

    if (error) {
      console.error('🔍 Debug: Error fetching slots with bookings:', error);
      // Fallback to basic slots if join fails
      const { data: basicSlots, error: basicError } = await supabaseAdmin
        .from('trek_slots')
        .select('*')
        .eq('trek_slug', trekSlug)
        .order('date');

      if (basicError) {
        return NextResponse.json({ 
          error: 'Failed to fetch slots', 
          details: basicError.message,
          slots: []
        }, { status: 500 });
      }

      // Calculate booked counts separately for each slot
      const slotsWithCounts = await Promise.all(
        (basicSlots || []).map(async (slot) => {
          const { data: bookings, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .select('participants')
            .eq('slot_id', slot.id)
            .in('status', ['confirmed', 'pending']); // Count confirmed and pending bookings

          if (bookingError) {
            console.error('Error fetching bookings for slot:', slot.id, bookingError);
            return { ...slot, booked: slot.booked || 0 }; // Use existing booked count as fallback
          }

          const totalBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;
          
          return {
            ...slot,
            booked: totalBooked,
            available: Math.max(0, slot.capacity - totalBooked)
          };
        })
      );

      console.log('🔍 Debug: Slots with calculated counts:', { 
        trekSlug,
        totalSlots: slotsWithCounts.length,
        slotsWithCounts: slotsWithCounts.map(s => ({ 
          id: s.id, 
          date: s.date, 
          capacity: s.capacity, 
          booked: s.booked,
          available: s.available 
        }))
      });

      // Filter for available slots only
      const availableSlots = slotsWithCounts.filter(slot => 
        slot.status === 'open' && slot.available > 0
      );

      return NextResponse.json({ 
        slots: availableSlots,
        allSlots: slotsWithCounts,
        totalSlots: slotsWithCounts.length,
        availableSlots: availableSlots.length
      }, { status: 200 });
    }

    // Process slots with bookings data
    const processedSlots = (slotsWithBookings || []).map(slot => {
      // Calculate total booked participants from confirmed and pending bookings
      const totalBooked = slot.bookings
        ?.filter(booking => ['confirmed', 'pending'].includes(booking.status))
        ?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;

      return {
        id: slot.id,
        trek_slug: slot.trek_slug,
        date: slot.date,
        capacity: slot.capacity,
        booked: totalBooked,
        available: Math.max(0, slot.capacity - totalBooked),
        status: slot.status,
        created_at: slot.created_at,
        updated_at: slot.updated_at
      };
    });

    console.log('🔍 Debug: Processed slots with dynamic counts:', { 
      trekSlug,
      totalSlots: processedSlots.length,
      processedSlots: processedSlots.map(s => ({ 
        id: s.id, 
        date: s.date, 
        capacity: s.capacity, 
        booked: s.booked,
        available: s.available 
      }))
    });

    // Filter for available slots only
    const availableSlots = processedSlots.filter(slot => 
      slot.status === 'open' && slot.available > 0
    );

    return NextResponse.json({ 
      slots: availableSlots,
      allSlots: processedSlots,
      totalSlots: processedSlots.length,
      availableSlots: availableSlots.length
    }, { status: 200 });

  } catch (error) {
    console.error('🔍 Debug: Dynamic slots API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      slots: []
    }, { status: 500 });
  }
}

// POST /api/slots/dynamic/sync - Sync all slot booked counts with actual bookings
export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Starting slot booked counts synchronization...');

    // Get all slots
    const { data: allSlots, error: slotsError } = await supabaseAdmin
      .from('trek_slots')
      .select('*');

    if (slotsError) {
      console.error('Error fetching slots for sync:', slotsError);
      return NextResponse.json({ 
        error: 'Failed to fetch slots for synchronization',
        details: slotsError.message 
      }, { status: 500 });
    }

    if (!allSlots || allSlots.length === 0) {
      return NextResponse.json({ 
        message: 'No slots found to synchronize',
        updatedSlots: 0 
      }, { status: 200 });
    }

    let updatedCount = 0;
    const updateResults = [];

    // Process each slot
    for (const slot of allSlots) {
      try {
        // Calculate actual booked count from bookings table
        const { data: bookings, error: bookingError } = await supabaseAdmin
          .from('bookings')
          .select('participants')
          .eq('slot_id', slot.id)
          .in('status', ['confirmed', 'pending']);

        if (bookingError) {
          console.error(`Error fetching bookings for slot ${slot.id}:`, bookingError);
          updateResults.push({
            slotId: slot.id,
            date: slot.date,
            error: bookingError.message
          });
          continue;
        }

        const actualBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;

        // Update slot if booked count is different
        if (actualBooked !== slot.booked) {
          const { error: updateError } = await supabaseAdmin
            .from('trek_slots')
            .update({ booked: actualBooked })
            .eq('id', slot.id);

          if (updateError) {
            console.error(`Error updating slot ${slot.id}:`, updateError);
            updateResults.push({
              slotId: slot.id,
              date: slot.date,
              error: updateError.message
            });
          } else {
            updatedCount++;
            updateResults.push({
              slotId: slot.id,
              date: slot.date,
              trekSlug: slot.trek_slug,
              oldBooked: slot.booked,
              newBooked: actualBooked,
              capacity: slot.capacity,
              updated: true
            });
            console.log(`✅ Updated slot ${slot.id}: ${slot.booked} → ${actualBooked} booked`);
          }
        } else {
          updateResults.push({
            slotId: slot.id,
            date: slot.date,
            trekSlug: slot.trek_slug,
            booked: actualBooked,
            capacity: slot.capacity,
            updated: false,
            message: 'Already in sync'
          });
        }
      } catch (error) {
        console.error(`Error processing slot ${slot.id}:`, error);
        updateResults.push({
          slotId: slot.id,
          date: slot.date,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    console.log(`🔄 Synchronization completed: ${updatedCount}/${allSlots.length} slots updated`);

    return NextResponse.json({
      message: 'Slot synchronization completed',
      totalSlots: allSlots.length,
      updatedSlots: updatedCount,
      results: updateResults
    }, { status: 200 });

  } catch (error) {
    console.error('🔄 Slot synchronization error:', error);
    return NextResponse.json({ 
      error: 'Failed to synchronize slot counts',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
