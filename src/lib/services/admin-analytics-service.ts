import { supabaseAdmin } from '@/lib/supabase';

export interface AdminMetrics {
  total_bookings: number;
  total_revenue: number;
  active_users: number;
  pending_approvals: number;
  conversion_rate: number;
  average_booking_value: number;
  top_destinations: Array<{name: string, bookings: number}>;
  monthly_trends: Array<{month: string, bookings: number, revenue: number}>;
}

export interface RecentActivity {
  id: string;
  type: 'booking' | 'payment' | 'user' | 'review';
  message: string;
  user: string;
  amount?: number;
  rating?: number;
  timestamp: string;
  status: string;
}

export interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  premium_users: number;
  user_growth_rate: number;
  top_user_segments: Array<{
    segment: string;
    count: number;
    percentage: number;
  }>;
}

export interface BookingStats {
  total_bookings: number;
  confirmed_bookings: number;
  pending_bookings: number;
  cancelled_bookings: number;
  average_booking_value: number;
  booking_success_rate: number;
  popular_time_slots: Array<{
    time: string;
    bookings: number;
  }>;
}

export interface RevenueAnalytics {
  total_revenue: number;
  monthly_revenue: number;
  revenue_growth: number;
  average_order_value: number;
  revenue_by_destination: Array<{
    destination: string;
    revenue: number;
    percentage: number;
  }>;
  payment_methods: Array<{
    method: string;
    revenue: number;
    percentage: number;
  }>;
}

export interface PerformanceChartData {
  bookings_trend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  revenue_trend: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  destination_performance: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
    }>;
  };
}

export interface AdminDashboardData {
  metrics: AdminMetrics;
  recent_activity: Array<RecentActivity>;
  alerts: Array<Alert>;
  performance_chart_data: PerformanceChartData;
}

export class AdminAnalyticsService {
  /**
   * Get comprehensive admin dashboard data
   */
  static async getDashboardData(): Promise<AdminDashboardData> {
    try {
      // Get basic metrics
      const metrics = await this.getBasicMetrics();
      
      // Get recent activity
      const recentActivity = await this.getRecentActivity();
      
      // Get alerts
      const alerts = await this.getAlerts();
      
      // Get performance chart data
      const performanceChartData = await this.getPerformanceChartData();

      return {
        metrics,
        recent_activity: recentActivity,
        alerts,
        performance_chart_data: performanceChartData
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get basic business metrics from real database
   */
  private static async getBasicMetrics(): Promise<AdminMetrics> {
    try {
      // Get total bookings
      const { count: totalBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Get total revenue
      const { data: revenueData } = await supabaseAdmin
        .from('bookings')
        .select('total_amount')
        .eq('status', 'confirmed');
      
      const totalRevenue = revenueData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

      // Get active users (users who logged in within last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: activeUsers } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('last_login', thirtyDaysAgo.toISOString());

      // Get pending approvals
      const { count: pendingApprovals } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Calculate average booking value
      const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

      // Get top destinations
      const { data: topDestinationsData } = await supabaseAdmin
        .from('bookings')
        .select('trek_name')
        .eq('status', 'confirmed');

      const destinationCounts = topDestinationsData?.reduce((acc: any, booking) => {
        const trekName = booking.trek_name || 'Unknown Trek';
        acc[trekName] = (acc[trekName] || 0) + 1;
        return acc;
      }, {}) || {};

      const topDestinations = Object.entries(destinationCounts)
        .map(([name, bookings]) => ({ name, bookings: bookings as number }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Get monthly trends for the last 8 months
      const monthlyTrends = [];
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const { count: monthlyBookings } = await supabaseAdmin
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const { data: monthlyRevenueData } = await supabaseAdmin
          .from('bookings')
          .select('total_amount')
          .eq('status', 'confirmed')
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        const monthlyRevenue = monthlyRevenueData?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          bookings: monthlyBookings || 0,
          revenue: monthlyRevenue
        });
      }

      // Calculate conversion rate (confirmed bookings / total bookings)
      const { count: confirmedBookings } = await supabaseAdmin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed');

      const conversionRate = totalBookings > 0 ? ((confirmedBookings || 0) / totalBookings) * 100 : 0;

      return {
        total_bookings: totalBookings || 0,
        total_revenue: totalRevenue,
        active_users: activeUsers || 0,
        pending_approvals: pendingApprovals || 0,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        average_booking_value: averageBookingValue,
        top_destinations: topDestinations,
        monthly_trends: monthlyTrends
      };
    } catch (error) {
      console.error('Error fetching real metrics:', error);
      // Fallback to basic data if database queries fail
      return {
        total_bookings: 0,
        total_revenue: 0,
        active_users: 0,
        pending_approvals: 0,
        conversion_rate: 0,
        average_booking_value: 0,
        top_destinations: [],
        monthly_trends: []
      };
    }
  }

  /**
   * Get recent activity for admin dashboard
   */
  private static async getRecentActivity(): Promise<Array<RecentActivity>> {
    // Mock data - replace with actual database queries
    return [
      {
        id: '1',
        type: 'booking',
        message: 'New booking received for Kedarkantha Trek',
        user: 'John Doe',
        amount: 8999,
        timestamp: new Date().toISOString(),
        status: 'pending'
      },
      {
        id: '2',
        type: 'payment',
        message: 'Payment received for Valley of Flowers Trek',
        user: 'Jane Smith',
        amount: 12999,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'completed'
      },
      {
        id: '3',
        type: 'user',
        message: 'New user registration',
        user: 'Mike Johnson',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'pending'
      },
      {
        id: '4',
        type: 'review',
        message: 'New review posted for Hampta Pass Trek',
        user: 'Sarah Wilson',
        rating: 5,
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        status: 'published'
      }
    ];
  }

  /**
   * Get alerts for admin dashboard
   */
  private static async getAlerts(): Promise<Array<Alert>> {
    // Mock data - replace with actual database queries
    return [
      {
        id: '1',
        type: 'warning',
        title: 'Low Inventory Alert',
        message: 'Kedarkantha Trek has only 5 slots remaining',
        priority: 'high',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'info',
        title: 'Payment Pending',
        message: '3 payments pending approval',
        priority: 'medium',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: '3',
        type: 'success',
        title: 'Revenue Milestone',
        message: 'Monthly revenue target achieved',
        priority: 'low',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ];
  }

  /**
   * Get performance chart data
   */
  private static async getPerformanceChartData(): Promise<PerformanceChartData> {
    // Mock data - replace with actual database queries
    return {
      bookings_trend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          label: 'Bookings',
          data: [89, 102, 156, 134, 167, 189, 201, 189],
          borderColor: '#1E88E5',
          backgroundColor: 'rgba(30, 136, 229, 0.1)',
          tension: 0.4
        }]
      },
      revenue_trend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          label: 'Revenue (₹)',
          data: [203450, 234100, 356800, 298900, 381200, 432100, 458900, 431200],
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        }]
      },
      destination_performance: {
        labels: ['Kedarkantha', 'Valley of Flowers', 'Hampta Pass', 'Roopkund', 'Chopta'],
        datasets: [{
          label: 'Bookings',
          data: [156, 134, 98, 87, 76],
          backgroundColor: [
            '#1E88E5',
            '#4CAF50',
            '#FF9800',
            '#9C27B0',
            '#F44336'
          ]
        }]
      }
    };
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<UserStats> {
    // Mock data - replace with actual database queries
    return {
      total_users: 2847,
      active_users: 892,
      new_users_this_month: 156,
      premium_users: 234,
      user_growth_rate: 12.5,
      top_user_segments: [
        { segment: 'Adventure Seekers', count: 456, percentage: 32.1 },
        { segment: 'Nature Lovers', count: 389, percentage: 27.4 },
        { segment: 'Photography Enthusiasts', count: 234, percentage: 16.5 },
        { segment: 'Fitness Enthusiasts', count: 198, percentage: 13.9 },
        { segment: 'Others', count: 134, percentage: 9.4 }
      ]
    };
  }

  /**
   * Get booking statistics
   */
  static async getBookingStats(): Promise<BookingStats> {
    // Mock data - replace with actual database queries
    return {
      total_bookings: 1247,
      confirmed_bookings: 1189,
      pending_bookings: 45,
      cancelled_bookings: 13,
      average_booking_value: 2285,
      booking_success_rate: 95.3,
      popular_time_slots: [
        { time: 'Morning (6-9 AM)', bookings: 456 },
        { time: 'Afternoon (12-3 PM)', bookings: 234 },
        { time: 'Evening (6-9 PM)', bookings: 389 },
        { time: 'Night (9 PM-12 AM)', bookings: 168 }
      ]
    };
  }

  /**
   * Get revenue analytics
   */
  static async getRevenueAnalytics(): Promise<RevenueAnalytics> {
    // Mock data - replace with actual database queries
    return {
      total_revenue: 2847500,
      monthly_revenue: 431200,
      revenue_growth: 15.2,
      average_order_value: 2285,
      revenue_by_destination: [
        { destination: 'Kedarkantha Trek', revenue: 356400, percentage: 12.5 },
        { destination: 'Valley of Flowers', revenue: 348600, percentage: 12.2 },
        { destination: 'Hampta Pass', revenue: 224100, percentage: 7.9 },
        { destination: 'Roopkund Trek', revenue: 198900, percentage: 7.0 },
        { destination: 'Chopta Trek', revenue: 173600, percentage: 6.1 }
      ],
      payment_methods: [
        { method: 'Credit Card', revenue: 1423750, percentage: 50.0 },
        { method: 'UPI', revenue: 854250, percentage: 30.0 },
        { method: 'Net Banking', revenue: 569500, percentage: 20.0 }
      ]
    };
  }

  /**
   * Save analytics data to database
   */
  static async saveAnalyticsData(userId: string, metricName: string, metricValue: string | number | boolean): Promise<void> {
    try {
      const periodStart = new Date();
      periodStart.setHours(0, 0, 0, 0);
      
      const periodEnd = new Date();
      periodEnd.setHours(23, 59, 59, 999);

      await supabaseAdmin
        .from('admin_analytics')
        .upsert({
          user_id: userId,
          metric_name: metricName,
          metric_value: metricValue,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString()
        }, {
          onConflict: 'user_id,metric_name,period_start'
        });
    } catch (error) {
      console.error('Error saving analytics data:', error);
      throw error;
    }
  }
} 