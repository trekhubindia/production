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

    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all analytics data in parallel
    const [
      totalTreks,
      totalBookings,
      totalUsers,
      totalRevenue,
      monthlyBookings,
      lastMonthBookings,
      monthlyRevenue,
      lastMonthRevenue,
      monthlyUsers,
      lastMonthUsers,
      recentBookings,
      topTreks,
      bookingsByStatus,
      revenueByMonth,
      userGrowth,
      trekSlots,
      pendingBookings,
      expiringVouchers,
      faqStats,
      recentActivity
    ] = await Promise.all([
      // Total counts
      supabaseAdmin.from('treks').select('id', { count: 'exact' }),
      supabaseAdmin.from('bookings').select('id', { count: 'exact' }),
      supabaseAdmin.from('auth_user').select('id', { count: 'exact' }),
      
      // Total revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .then(result => {
          const total = result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
          return total;
        }),

      // Monthly bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfMonth.toISOString()),

      // Last month bookings
      supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString()),

      // Monthly revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfMonth.toISOString())
        .then(result => {
          const total = result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
          return total;
        }),

      // Last month revenue
      supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed')
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString())
        .then(result => {
          const total = result.data?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
          return total;
        }),

      // Monthly users
      supabaseAdmin
        .from('auth_user')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfMonth.toISOString()),

      // Last month users
      supabaseAdmin
        .from('auth_user')
        .select('id', { count: 'exact' })
        .gte('created_at', startOfLastMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString()),

      // Recent bookings
      supabaseAdmin
        .from('bookings')
        .select('id, customer_name, trek_name, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Top treks by bookings
      supabaseAdmin
        .from('bookings')
        .select('trek_name')
        .gte('created_at', last30Days.toISOString())
        .then(result => {
          const trekCounts = result.data?.reduce((acc: Record<string, number>, booking) => {
            const trekName = booking.trek_name || 'Unknown Trek';
            acc[trekName] = (acc[trekName] || 0) + 1;
            return acc;
          }, {}) || {};
          
          return Object.entries(trekCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, bookings: count }));
        }),

      // Bookings by status
      supabaseAdmin
        .from('bookings')
        .select('status')
        .gte('created_at', startOfMonth.toISOString())
        .then(result => {
          const statusCounts = result.data?.reduce((acc: Record<string, number>, booking) => {
            const status = booking.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}) || {};
          return statusCounts;
        }),

      // Revenue by month (last 6 months)
      supabaseAdmin
        .from('bookings')
        .select('total_amount, created_at')
        .eq('status', 'confirmed')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
        .then(result => {
          const monthlyRevenue: Record<string, number> = {};
          result.data?.forEach(booking => {
            const date = new Date(booking.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (booking.total_amount || 0);
          });
          return monthlyRevenue;
        }),

      // User growth (last 6 months)
      supabaseAdmin
        .from('auth_user')
        .select('created_at')
        .gte('created_at', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString())
        .then(result => {
          const monthlyUsers: Record<string, number> = {};
          result.data?.forEach(user => {
            const date = new Date(user.created_at);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyUsers[monthKey] = (monthlyUsers[monthKey] || 0) + 1;
          });
          return monthlyUsers;
        }),

      // Trek slots status
      supabaseAdmin
        .from('trek_slots')
        .select('trek_slug, available_slots, total_slots, treks(name)')
        .order('available_slots', { ascending: true })
        .limit(10),

      // Pending bookings
      supabaseAdmin
        .from('bookings')
        .select('id, customer_name, trek_name, created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),

      // Expiring vouchers
      supabaseAdmin
        .from('vouchers')
        .select('code, discount_amount, expires_at')
        .gte('expires_at', now.toISOString())
        .lte('expires_at', new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('expires_at', { ascending: true })
        .limit(5),

      // FAQ stats
      supabaseAdmin
        .from('trek_faqs')
        .select('view_count, is_featured, status')
        .then(result => {
          const stats = result.data?.reduce((acc, faq) => {
            acc.total += 1;
            acc.totalViews += faq.view_count || 0;
            if (faq.is_featured) acc.featured += 1;
            if (faq.status === 'answered') acc.answered += 1;
            return acc;
          }, { total: 0, totalViews: 0, featured: 0, answered: 0 }) || 
          { total: 0, totalViews: 0, featured: 0, answered: 0 };
          return stats;
        }),

      // Recent activity (simplified)
      supabaseAdmin
        .from('bookings')
        .select('customer_name, trek_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
        .then(result => {
          return result.data?.map(booking => ({
            type: 'booking',
            description: `${booking.customer_name} booked ${booking.trek_name}`,
            timestamp: booking.created_at,
            status: booking.status
          })) || [];
        })
    ]);

    // Calculate percentage changes
    const bookingGrowth = lastMonthBookings.count ? 
      ((monthlyBookings.count || 0) - (lastMonthBookings.count || 0)) / (lastMonthBookings.count || 1) * 100 : 0;
    
    const revenueGrowth = lastMonthRevenue ? 
      ((monthlyRevenue || 0) - (lastMonthRevenue || 0)) / (lastMonthRevenue || 1) * 100 : 0;
    
    const userGrowthPercent = lastMonthUsers.count ? 
      ((monthlyUsers.count || 0) - (lastMonthUsers.count || 0)) / (lastMonthUsers.count || 1) * 100 : 0;

    // Format response
    const analytics = {
      overview: {
        totalTreks: totalTreks.count || 0,
        totalBookings: totalBookings.count || 0,
        totalUsers: totalUsers.count || 0,
        totalRevenue: totalRevenue || 0,
        monthlyBookings: monthlyBookings.count || 0,
        monthlyRevenue: monthlyRevenue || 0,
        monthlyUsers: monthlyUsers.count || 0,
        bookingGrowth: Math.round(bookingGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        userGrowth: Math.round(userGrowthPercent * 100) / 100
      },
      charts: {
        topTreks: topTreks || [],
        bookingsByStatus: bookingsByStatus || {},
        revenueByMonth: revenueByMonth || {},
        userGrowthByMonth: userGrowth || {}
      },
      recentBookings: recentBookings.data || [],
      trekSlots: trekSlots.data || [],
      pendingBookings: pendingBookings.data || [],
      expiringVouchers: expiringVouchers.data || [],
      faqStats: faqStats || { total: 0, totalViews: 0, featured: 0, answered: 0 },
      recentActivity: recentActivity || []
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
