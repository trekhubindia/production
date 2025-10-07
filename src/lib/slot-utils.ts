import { supabaseAdmin } from '@/lib/supabase';

/**
 * Update the booked count for a specific slot based on actual bookings
 */
export async function updateSlotBookedCount(slotId: string): Promise<{ success: boolean; error?: string; bookedCount?: number }> {
  try {
    console.log(`🔄 Updating booked count for slot ${slotId}`);

    // Calculate actual booked count from bookings table
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('participants')
      .eq('slot_id', slotId)
      .in('status', ['confirmed', 'pending']); // Count confirmed and pending bookings

    if (bookingError) {
      console.error(`Error fetching bookings for slot ${slotId}:`, bookingError);
      return { success: false, error: bookingError.message };
    }

    const actualBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;

    // Update slot booked count
    const { error: updateError } = await supabaseAdmin
      .from('trek_slots')
      .update({ booked: actualBooked })
      .eq('id', slotId);

    if (updateError) {
      console.error(`Error updating slot ${slotId}:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Updated slot ${slotId}: booked count = ${actualBooked}`);
    return { success: true, bookedCount: actualBooked };

  } catch (error) {
    console.error(`Error updating slot ${slotId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Update booked counts for all slots of a specific trek
 */
export async function updateTrekSlotsBookedCounts(trekSlug: string): Promise<{ success: boolean; error?: string; updatedSlots?: number }> {
  try {
    console.log(`🔄 Updating booked counts for all slots of trek ${trekSlug}`);

    // Get all slots for the trek
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('trek_slots')
      .select('id')
      .eq('trek_slug', trekSlug);

    if (slotsError) {
      console.error(`Error fetching slots for trek ${trekSlug}:`, slotsError);
      return { success: false, error: slotsError.message };
    }

    if (!slots || slots.length === 0) {
      console.log(`No slots found for trek ${trekSlug}`);
      return { success: true, updatedSlots: 0 };
    }

    let updatedCount = 0;
    const errors = [];

    // Update each slot
    for (const slot of slots) {
      const result = await updateSlotBookedCount(slot.id);
      if (result.success) {
        updatedCount++;
      } else {
        errors.push(`Slot ${slot.id}: ${result.error}`);
      }
    }

    if (errors.length > 0) {
      console.error(`Some slots failed to update for trek ${trekSlug}:`, errors);
      return { 
        success: false, 
        error: `${errors.length} slots failed to update: ${errors.join(', ')}`,
        updatedSlots: updatedCount
      };
    }

    console.log(`✅ Updated ${updatedCount} slots for trek ${trekSlug}`);
    return { success: true, updatedSlots: updatedCount };

  } catch (error) {
    console.error(`Error updating trek slots for ${trekSlug}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Get dynamic slot data with real-time booked counts
 */
export async function getSlotWithDynamicCount(slotId: string): Promise<{ 
  success: boolean; 
  error?: string; 
  slot?: {
    id: string;
    trek_slug: string;
    date: string;
    capacity: number;
    booked: number;
    available: number;
    status: string;
  }
}> {
  try {
    // Get slot data
    const { data: slot, error: slotError } = await supabaseAdmin
      .from('trek_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError) {
      console.error(`Error fetching slot ${slotId}:`, slotError);
      return { success: false, error: slotError.message };
    }

    if (!slot) {
      return { success: false, error: 'Slot not found' };
    }

    // Calculate dynamic booked count
    const { data: bookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('participants')
      .eq('slot_id', slotId)
      .in('status', ['confirmed', 'pending']);

    if (bookingError) {
      console.error(`Error fetching bookings for slot ${slotId}:`, bookingError);
      return { success: false, error: bookingError.message };
    }

    const dynamicBooked = bookings?.reduce((sum, booking) => sum + (booking.participants || 0), 0) || 0;

    return {
      success: true,
      slot: {
        id: slot.id,
        trek_slug: slot.trek_slug,
        date: slot.date,
        capacity: slot.capacity,
        booked: dynamicBooked,
        available: Math.max(0, slot.capacity - dynamicBooked),
        status: slot.status
      }
    };

  } catch (error) {
    console.error(`Error getting dynamic slot data for ${slotId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}
