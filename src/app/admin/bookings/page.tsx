import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';
import AdminBookingsClient from './AdminBookingsClient';

export default async function AdminBookingsPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Bookings Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Bookings Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  // Fetch bookings data server-side with trek and slot information
  let { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings data');
  }

  if (!bookings || bookings.length === 0) {
    console.log('✅ Admin Bookings Page: No bookings found');
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <AdminBookingsClient bookings={[]} />
      </div>
    );
  }

  // Extract unique IDs for separate queries
  const trekIds = [...new Set(bookings.map(b => b.treks).filter(Boolean))];
  const trekSlugs = [...new Set(bookings.map(b => b.trek_slug).filter(Boolean))];
  const slotIds = [...new Set(bookings.map(b => b.slot_id).filter(Boolean))];
  const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))];

  // Fetch related data separately
  const [treksResult, slotsResult, profilesResult] = await Promise.all([
    // Fetch all treks that are referenced by bookings
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

  // Create lookup maps - use both ID and slug for trek lookup
  const treksMapById = new Map((treksResult.data || []).map(t => [t.id, t]));
  const treksMapBySlug = new Map((treksResult.data || []).map(t => [t.slug, t]));
  const slotsMap = new Map((slotsResult.data || []).map(s => [s.id, s]));
  const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));

  // Merge data - prioritize trek ID lookup, fallback to slug
  bookings = bookings.map(booking => ({
    ...booking,
    treks: treksMapById.get(booking.treks) || treksMapBySlug.get(booking.trek_slug) || null,
    trek_slots: slotsMap.get(booking.slot_id) || null,
    user_profiles: profilesMap.get(booking.user_id) || null
  }));


  // Transform data for client component
  const transformedBookings = bookings?.map(booking => ({
    ...booking,
    customer_name: booking.user_profiles?.name || booking.customer_name || booking.customer_email || booking.user_id,
    trek_name: booking.treks?.name || booking.trek_name,
    trek_date: booking.trek_slots?.date || booking.trek_date || booking.booking_date,
    // Ensure treks object is preserved
    treks: booking.treks ? {
      id: booking.treks.id,
      name: booking.treks.name,
      slug: booking.treks.slug,
      region: booking.treks.region,
      difficulty: booking.treks.difficulty,
      duration: booking.treks.duration,
      price: booking.treks.price
    } : undefined,
    // Ensure trek_slots object is preserved
    trek_slots: booking.trek_slots ? {
      id: booking.trek_slots.id,
      date: booking.trek_slots.date,
      capacity: booking.trek_slots.capacity,
      booked: booking.trek_slots.booked
    } : undefined,
    // Ensure user_profiles object is preserved
    user_profiles: booking.user_profiles ? {
      id: booking.user_profiles.id,
      name: booking.user_profiles.name,
      username: booking.user_profiles.username,
      phone: booking.user_profiles.phone,
      gender: booking.user_profiles.gender,
      date_of_birth: booking.user_profiles.date_of_birth,
      location: booking.user_profiles.location,
      bio: booking.user_profiles.bio,
      website: booking.user_profiles.website,
      avatar_url: booking.user_profiles.avatar_url
    } : undefined
  })) || [];

  console.log('✅ Admin Bookings Page: All checks passed, rendering bookings page');

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminBookingsClient bookings={transformedBookings} />
    </div>
  );
} 