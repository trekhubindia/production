import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
 
export async function GET() {
  // Fetch bookings first
  let { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!bookings || bookings.length === 0) {
    return NextResponse.json([]);
  }

  // Get unique trek slugs and slot IDs
  const trekSlugs = [...new Set(bookings.map(b => b.trek_slug).filter(Boolean))];
  const slotIds = [...new Set(bookings.map(b => b.slot_id).filter(Boolean))];
  const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];

  // Fetch related data separately
  const [treksResult, slotsResult, profilesResult] = await Promise.all([
    // Fetch treks
    supabaseAdmin
      .from('treks')
      .select('id, name, slug, region, difficulty, duration, price')
      .in('slug', trekSlugs),
    
    // Fetch trek slots
    supabaseAdmin
      .from('trek_slots')
      .select('id, date, capacity, booked')
      .in('id', slotIds),
    
    // Fetch user profiles
    supabaseAdmin
      .from('user_profiles')
      .select('*')
      .in('user_id', userIds)
  ]);

  // Create lookup maps
  const treksMap = new Map((treksResult.data || []).map(t => [t.slug, t]));
  const slotsMap = new Map((slotsResult.data || []).map(s => [s.id, s]));
  const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

  // Merge data
  const enrichedBookings = bookings.map(booking => ({
    ...booking,
    treks: treksMap.get(booking.trek_slug) || null,
    trek_slots: slotsMap.get(booking.slot_id) || null,
    user_profiles: profilesMap.get(booking.user_id) || null
  }));
  
  return NextResponse.json(enrichedBookings);
} 