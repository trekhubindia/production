import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userData.email;

    // Get user's bookings stats
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        booking_date,
        trek_slug
      `)
      .eq('user_id', userData.id);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Calculate stats
    const totalBookings = bookings?.length || 0;
    const upcomingBookings = bookings?.filter(booking => 
      new Date(booking.booking_date) > new Date() && 
      ['confirmed', 'pending_approval', 'approved', 'pending'].includes(booking.status)
    ).length || 0;
    
    const completedBookings = bookings?.filter(booking => 
      booking.status === 'completed' || 
      (new Date(booking.booking_date) < new Date() && booking.status === 'confirmed')
    ).length || 0;
    
    const totalSpent = bookings?.reduce((sum, booking) => {
      // Only count money as "spent" when trek is completed
      const isCompleted = booking.status === 'completed' || 
        (new Date(booking.booking_date) < new Date() && booking.status === 'confirmed');
      return isCompleted ? sum + (booking.total_amount || 0) : sum;
    }, 0) || 0;

    // Get user's wishlist count
    const { data: wishlistData, error: wishlistError } = await supabaseAdmin
      .from('wishlists')
      .select('id')
      .eq('user_id', userData.id);

    const wishlistCount = wishlistData?.length || 0;

    // Get user's vouchers count
    const { data: vouchersData, error: vouchersError } = await supabaseAdmin
      .from('vouchers')
      .select('id, status')
      .eq('user_id', userData.id);

    const activeVouchers = vouchersData?.filter(voucher => voucher.status === 'active').length || 0;

    const stats = {
      totalBookings,
      upcomingBookings,
      completedBookings,
      totalSpent,
      wishlistCount,
      activeVouchers
    };

    return NextResponse.json({ success: true, stats });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
