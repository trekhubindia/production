import { supabaseRealtime } from '@/lib/supabase';

/**
 * Broadcast a new booking event to admin listeners.
 * Uses Realtime broadcast channel so clients don't need DB privileges.
 */
export async function notifyNewBookingToAdmins(booking: Record<string, unknown>) {
  const channel = supabaseRealtime.channel('admin_bookings');
  try {
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'new-booking',
      payload: { booking },
    });
  } finally {
    supabaseRealtime.removeChannel(channel);
  }
}


