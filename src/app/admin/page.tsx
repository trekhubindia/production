import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  // Server-side authentication check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;

  if (!sessionId) {
    console.log('🔒 Admin Dashboard Page: No session found, redirecting to login');
    redirect('/auth');
  }

  // Check admin permissions
  const authResult = await canUserAccessAdmin(sessionId);
  
  if (!authResult.canAccess) {
    console.log('🔒 Admin Dashboard Page: User not authorized, redirecting to login');
    if (authResult.redirectUrl) {
      redirect(authResult.redirectUrl);
    } else {
      redirect('/auth');
    }
  }

  // Fetch dashboard data
  const [trekCount, bookingCount, userCount, chartData] = await Promise.all([
    // Get trek count for next 30 days
    supabaseAdmin
      .from('treks')
      .select('id', { count: 'exact' })
      .gte('start_date', new Date().toISOString())
      .lte('start_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
      .then(result => result.count || 0),

    // Get booking count for current month
    supabaseAdmin
      .from('bookings')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .then(result => result.count || 0),

    // Get user count for current month
    supabaseAdmin
      .from('auth_user')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .then(result => result.count || 0),

    // Get chart data (bookings per trek)
    supabaseAdmin
      .from('bookings')
      .select('trek_name')
      .then(result => {
        const bookings = result.data || [];
        const trekBookings = bookings.reduce((acc: Record<string, number>, booking) => {
          const trekName = booking.trek_name || 'Unknown Trek';
          acc[trekName] = (acc[trekName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          labels: Object.keys(trekBookings),
          datasets: [{
            label: 'Bookings',
            data: Object.values(trekBookings),
            backgroundColor: 'rgba(0, 230, 118, 0.8)',
            borderColor: 'rgba(0, 230, 118, 1)',
            borderWidth: 1
          }]
        };
      })
  ]);

  console.log('✅ Admin Dashboard Page: All checks passed, rendering dashboard');

  return (
    <AdminDashboardClient 
      trekCount={trekCount}
      bookingCount={bookingCount}
      userCount={userCount}
      chartData={chartData}
    />
  );
} 