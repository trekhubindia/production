import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const sessionId = request.cookies.get('auth_session')?.value;
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch real-time stats
    const [
      todayBookings,
      yesterdayBookings,
      weeklyBookings,
      todayRevenue,
      yesterdayRevenue,
      weeklyRevenue,
      activeUsers,
      recentActivity,
      systemHealth
    ] = await Promise.all([
      // Today's bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', today.toISOString()),

      // Yesterday's bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString()),

      // This week's bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', thisWeek.toISOString()),

      // Today's revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .gte('created_at', today.toISOString())
        .then(result => {
          return result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
        }),

      // Yesterday's revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .gte('created_at', yesterday.toISOString())
        .lt('created_at', today.toISOString())
        .then(result => {
          return result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
        }),

      // This week's revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .gte('created_at', thisWeek.toISOString())
        .then(result => {
          return result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
        }),

      // Active users (users with sessions in last 24 hours)
      supabaseAdmin
        .from('user_session')
        .select('user_id', { count: 'exact' })
        .gte('expires_at', now.toISOString()),

      // Recent activity (last 10 actions)
      supabaseAdmin
        .from('bookings')
        .select('id, customer_name, trek_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(result => {
          return result.data?.map(booking => ({
            id: booking.id,
            type: 'booking',
            description: `${booking.customer_name} ${booking.status === 'confirmed' ? 'confirmed' : 'made'} booking for ${booking.trek_name}`,
            timestamp: booking.created_at,
            status: booking.status
          })) || [];
        }),

      // System health checks
      Promise.all([
        // Database response time test
        supabaseAdmin.from('treks').select('id').limit(1).then(() => ({ database: 'healthy' })),
        // FAQ system health
        supabaseAdmin.from('trek_faqs').select('id', { count: 'exact' }).then(result => ({ 
          faqs: result.count ? 'healthy' : 'warning' 
        })),
        // Booking system health
        supabaseAdmin.from('bookings').select('id', { count: 'exact' }).then(result => ({ 
          bookings: result.count ? 'healthy' : 'warning' 
        }))
      ]).then(results => Object.assign({}, ...results))
    ]);

    // Calculate percentage changes
    const bookingChange = yesterdayBookings.count ? 
      ((todayBookings.count || 0) - (yesterdayBookings.count || 0)) / (yesterdayBookings.count || 1) * 100 : 0;
    
    const revenueChange = yesterdayRevenue ? 
      ((todayRevenue || 0) - (yesterdayRevenue || 0)) / (yesterdayRevenue || 1) * 100 : 0;

    // Get hourly breakdown for today
    const hourlyBookings = await supabaseAdmin
      .from('bookings')
      .select('created_at')
      .gte('created_at', today.toISOString())
      .then(result => {
        const hourlyData: Record<number, number> = {};
        for (let i = 0; i < 24; i++) {
          hourlyData[i] = 0;
        }
        
        result.data?.forEach(booking => {
          const hour = new Date(booking.created_at).getHours();
          hourlyData[hour]++;
        });
        
        return hourlyData;
      });

    const realTimeStats = {
      today: {
        bookings: todayBookings.count || 0,
        revenue: todayRevenue || 0,
        bookingChange: Math.round(bookingChange * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100
      },
      week: {
        bookings: weeklyBookings.count || 0,
        revenue: weeklyRevenue || 0
      },
      activeUsers: activeUsers.count || 0,
      recentActivity: recentActivity || [],
      systemHealth: systemHealth || {},
      hourlyBookings: hourlyBookings || {},
      lastUpdated: now.toISOString()
    };

    return NextResponse.json(realTimeStats);

  } catch (error) {
    console.error('Real-time analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}
