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

    const { searchParams } = new URL(request.url);
    const chartType = searchParams.get('type') || 'all';
    const period = searchParams.get('period') || '6months';

    // Calculate date ranges based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    }

    const charts: any = {};

    // Revenue trend chart
    if (chartType === 'all' || chartType === 'revenue') {
      const revenueData = await supabaseAdmin
        .from('bookings')
        .select('total_amount, created_at')
        .eq('status', 'confirmed')
        .gte('created_at', startDate.toISOString());

      const revenueByPeriod: Record<string, number> = {};
      revenueData.data?.forEach(booking => {
        const date = new Date(booking.created_at);
        let periodKey: string;
        
        if (period === '7days' || period === '30days') {
          periodKey = date.toISOString().split('T')[0]; // Daily
        } else {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly
        }
        
        revenueByPeriod[periodKey] = (revenueByPeriod[periodKey] || 0) + (booking.total_amount || 0);
      });

      charts.revenue = {
        labels: Object.keys(revenueByPeriod).sort(),
        datasets: [{
          label: 'Revenue (₹)',
          data: Object.keys(revenueByPeriod).sort().map(key => revenueByPeriod[key]),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // Bookings trend chart
    if (chartType === 'all' || chartType === 'bookings') {
      const bookingsData = await supabaseAdmin
        .from('bookings')
        .select('created_at, status')
        .gte('created_at', startDate.toISOString());

      const bookingsByPeriod: Record<string, { confirmed: number, pending: number, cancelled: number }> = {};
      bookingsData.data?.forEach(booking => {
        const date = new Date(booking.created_at);
        let periodKey: string;
        
        if (period === '7days' || period === '30days') {
          periodKey = date.toISOString().split('T')[0]; // Daily
        } else {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly
        }
        
        if (!bookingsByPeriod[periodKey]) {
          bookingsByPeriod[periodKey] = { confirmed: 0, pending: 0, cancelled: 0 };
        }
        
        const status = booking.status as 'confirmed' | 'pending' | 'cancelled';
        if (status in bookingsByPeriod[periodKey]) {
          bookingsByPeriod[periodKey][status]++;
        }
      });

      const sortedPeriods = Object.keys(bookingsByPeriod).sort();
      
      charts.bookings = {
        labels: sortedPeriods,
        datasets: [
          {
            label: 'Confirmed',
            data: sortedPeriods.map(key => bookingsByPeriod[key]?.confirmed || 0),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 1
          },
          {
            label: 'Pending',
            data: sortedPeriods.map(key => bookingsByPeriod[key]?.pending || 0),
            backgroundColor: 'rgba(251, 191, 36, 0.8)',
            borderColor: 'rgb(251, 191, 36)',
            borderWidth: 1
          },
          {
            label: 'Cancelled',
            data: sortedPeriods.map(key => bookingsByPeriod[key]?.cancelled || 0),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: 'rgb(239, 68, 68)',
            borderWidth: 1
          }
        ]
      };
    }

    // Top treks chart
    if (chartType === 'all' || chartType === 'treks') {
      const trekBookings = await supabaseAdmin
        .from('bookings')
        .select('trek_name')
        .gte('created_at', startDate.toISOString());

      const trekCounts = trekBookings.data?.reduce((acc: Record<string, number>, booking) => {
        const trekName = booking.trek_name || 'Unknown Trek';
        acc[trekName] = (acc[trekName] || 0) + 1;
        return acc;
      }, {}) || {};

      const topTreks = Object.entries(trekCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

      charts.topTreks = {
        labels: topTreks.map(([name]) => name),
        datasets: [{
          label: 'Bookings',
          data: topTreks.map(([,count]) => count),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(14, 165, 233, 0.8)'
          ],
          borderWidth: 1
        }]
      };
    }

    // User registration trend
    if (chartType === 'all' || chartType === 'users') {
      const userData = await supabaseAdmin
        .from('auth_user')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const usersByPeriod: Record<string, number> = {};
      userData.data?.forEach(user => {
        const date = new Date(user.created_at);
        let periodKey: string;
        
        if (period === '7days' || period === '30days') {
          periodKey = date.toISOString().split('T')[0]; // Daily
        } else {
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // Monthly
        }
        
        usersByPeriod[periodKey] = (usersByPeriod[periodKey] || 0) + 1;
      });

      charts.users = {
        labels: Object.keys(usersByPeriod).sort(),
        datasets: [{
          label: 'New Users',
          data: Object.keys(usersByPeriod).sort().map(key => usersByPeriod[key]),
          borderColor: 'rgb(139, 92, 246)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      };
    }

    // FAQ engagement chart
    if (chartType === 'all' || chartType === 'faqs') {
      const faqData = await supabaseAdmin
        .from('trek_faqs')
        .select('question, view_count, is_featured')
        .order('view_count', { ascending: false })
        .limit(10);

      charts.faqs = {
        labels: faqData.data?.map(faq => 
          faq.question.length > 30 ? faq.question.substring(0, 30) + '...' : faq.question
        ) || [],
        datasets: [{
          label: 'Views',
          data: faqData.data?.map(faq => faq.view_count || 0) || [],
          backgroundColor: faqData.data?.map(faq => 
            faq.is_featured ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)'
          ) || [],
          borderWidth: 1
        }]
      };
    }

    return NextResponse.json({
      charts,
      period,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Charts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    );
  }
}
