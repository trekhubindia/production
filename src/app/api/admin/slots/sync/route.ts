import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { updateSlotBookedCount, updateTrekSlotsBookedCounts } from '@/lib/slot-utils';

// POST /api/admin/slots/sync - Sync slot booked counts (admin only)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { trekSlug, slotId, syncAll } = body;

    console.log('🔄 Admin slot sync request:', { trekSlug, slotId, syncAll });

    if (syncAll) {
      // Sync all slots in the database
      console.log('🔄 Syncing all slots...');
      
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

      for (const slot of allSlots) {
        const result = await updateSlotBookedCount(slot.id);
        if (result.success) {
          updatedCount++;
          updateResults.push({
            slotId: slot.id,
            trekSlug: slot.trek_slug,
            date: slot.date,
            oldBooked: slot.booked,
            newBooked: result.bookedCount,
            updated: slot.booked !== result.bookedCount
          });
        } else {
          updateResults.push({
            slotId: slot.id,
            trekSlug: slot.trek_slug,
            date: slot.date,
            error: result.error
          });
        }
      }

      return NextResponse.json({
        message: 'All slots synchronized',
        totalSlots: allSlots.length,
        updatedSlots: updatedCount,
        results: updateResults
      }, { status: 200 });

    } else if (trekSlug) {
      // Sync all slots for a specific trek
      console.log(`🔄 Syncing slots for trek: ${trekSlug}`);
      
      const result = await updateTrekSlotsBookedCounts(trekSlug);
      
      if (result.success) {
        return NextResponse.json({
          message: `Trek slots synchronized for ${trekSlug}`,
          updatedSlots: result.updatedSlots
        }, { status: 200 });
      } else {
        return NextResponse.json({
          error: `Failed to sync trek slots: ${result.error}`,
          updatedSlots: result.updatedSlots || 0
        }, { status: 500 });
      }

    } else if (slotId) {
      // Sync a specific slot
      console.log(`🔄 Syncing slot: ${slotId}`);
      
      const result = await updateSlotBookedCount(slotId);
      
      if (result.success) {
        return NextResponse.json({
          message: 'Slot synchronized',
          slotId,
          bookedCount: result.bookedCount
        }, { status: 200 });
      } else {
        return NextResponse.json({
          error: `Failed to sync slot: ${result.error}`
        }, { status: 500 });
      }

    } else {
      return NextResponse.json({
        error: 'Please specify trekSlug, slotId, or set syncAll to true'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('🔄 Admin slot sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to synchronize slots',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET /api/admin/slots/sync - Get sync status and recommendations
export async function GET(req: NextRequest) {
  try {
    console.log('📊 Checking slot sync status...');

    // Get all slots with their current booked counts
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('trek_slots')
      .select('*')
      .order('trek_slug, date');

    if (slotsError) {
      console.error('Error fetching slots:', slotsError);
      return NextResponse.json({ 
        error: 'Failed to fetch slots',
        details: slotsError.message 
      }, { status: 500 });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({ 
        message: 'No slots found',
        totalSlots: 0,
        outOfSync: 0,
        recommendations: []
      }, { status: 200 });
    }

    const syncStatus = [];
    let outOfSyncCount = 0;

    // Check each slot for sync status
    for (const slot of slots) {
      const { data: bookings, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('participants')
        .eq('slot_id', slot.id)
        .in('status', ['confirmed', 'pending']);

      if (bookingError) {
        syncStatus.push({
          slotId: slot.id,
          trekSlug: slot.trek_slug,
          date: slot.date,
          error: bookingError.message
        });
        continue;
      }

      const dynamicBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;
      const staticBooked = slot.booked || 0;
      const isOutOfSync = staticBooked !== dynamicBooked;

      if (isOutOfSync) {
        outOfSyncCount++;
      }

      syncStatus.push({
        slotId: slot.id,
        trekSlug: slot.trek_slug,
        date: slot.date,
        capacity: slot.capacity,
        staticBooked,
        dynamicBooked,
        isOutOfSync,
        available: Math.max(0, slot.capacity - dynamicBooked)
      });
    }

    // Generate recommendations
    const recommendations = [];
    if (outOfSyncCount > 0) {
      recommendations.push(`${outOfSyncCount} slots are out of sync and need synchronization`);
    }
    if (outOfSyncCount > slots.length * 0.5) {
      recommendations.push('Consider running a full synchronization');
    }
    if (outOfSyncCount === 0) {
      recommendations.push('All slots are in sync');
    }

    return NextResponse.json({
      message: 'Sync status retrieved',
      totalSlots: slots.length,
      outOfSync: outOfSyncCount,
      inSync: slots.length - outOfSyncCount,
      recommendations,
      slots: syncStatus
    }, { status: 200 });

  } catch (error) {
    console.error('📊 Slot sync status error:', error);
    return NextResponse.json({ 
      error: 'Failed to check sync status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
