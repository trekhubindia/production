"use client";
import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign,
  MessageSquare,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Gift,
  BarChart3,
  PieChart,
  LineChart
} from "lucide-react";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsData {
  overview: {
    totalTreks: number;
    totalBookings: number;
    totalUsers: number;
    totalRevenue: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    monthlyUsers: number;
    bookingGrowth: number;
    revenueGrowth: number;
    userGrowth: number;
  };
  charts: {
    topTreks: Array<{ name: string; bookings: number }>;
    bookingsByStatus: Record<string, number>;
    revenueByMonth: Record<string, number>;
    userGrowthByMonth: Record<string, number>;
  };
  recentBookings: Array<{
    id: string;
    customer_name: string;
    trek_name: string;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  trekSlots: Array<{
    trek_slug: string;
    available_slots: number;
    total_slots: number;
    treks: { name: string } | null;
  }>;
  pendingBookings: Array<{
    id: string;
    customer_name: string;
    trek_name: string;
    created_at: string;
  }>;
  expiringVouchers: Array<{
    code: string;
    discount_amount: number;
    expires_at: string;
  }>;
  faqStats: {
    total: number;
    totalViews: number;
    featured: number;
    answered: number;
  };
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
}

interface ChartData {
  charts: {
    revenue?: any;
    bookings?: any;
    topTreks?: any;
    users?: any;
    faqs?: any;
  };
  period: string;
  generatedAt: string;
}

export default function EnhancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('6months');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const [analyticsRes, chartsRes] = await Promise.all([
        fetch('/api/admin/analytics/overview'),
        fetch(`/api/admin/analytics/charts?period=${chartPeriod}`)
      ]);

      if (analyticsRes.ok) {
        const analytics = await analyticsRes.json();
        setAnalyticsData(analytics);
      }

      if (chartsRes.ok) {
        const charts = await chartsRes.json();
        setChartData(charts);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [chartPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  const { overview } = analyticsData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive business insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={chartPeriod} onValueChange={setChartPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAnalytics}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.revenueGrowth)}
              <span className={getGrowthColor(overview.revenueGrowth)}>
                {formatPercentage(overview.revenueGrowth)}
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalBookings}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.bookingGrowth)}
              <span className={getGrowthColor(overview.bookingGrowth)}>
                {formatPercentage(overview.bookingGrowth)}
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalUsers}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.userGrowth)}
              <span className={getGrowthColor(overview.userGrowth)}>
                {formatPercentage(overview.userGrowth)}
              </span>
              <span>from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">FAQ Engagement</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.faqStats.totalViews}</div>
            <div className="text-xs text-muted-foreground">
              {analyticsData.faqStats.answered}/{analyticsData.faqStats.total} answered
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {chartData?.charts.revenue && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                Revenue Trend
              </CardTitle>
              <CardDescription>Revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line 
                  data={chartData.charts.revenue} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '₹' + value.toLocaleString();
                          }
                        }
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings by Status */}
        {chartData?.charts.bookings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Bookings by Status
              </CardTitle>
              <CardDescription>Booking status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Bar 
                  data={chartData.charts.bookings} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top' as const
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Treks */}
        {chartData?.charts.topTreks && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Top Treks
              </CardTitle>
              <CardDescription>Most popular treks by bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut 
                  data={chartData.charts.topTreks} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'right' as const
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Growth */}
        {chartData?.charts.users && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="w-5 h-5" />
                User Growth
              </CardTitle>
              <CardDescription>New user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Line 
                  data={chartData.charts.users} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analyticsData.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{booking.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.trek_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatCurrency(booking.total_amount)}</div>
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {booking.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trek Slots Status */}
        <Card>
          <CardHeader>
            <CardTitle>Trek Slots Monitor</CardTitle>
            <CardDescription>Current availability status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {analyticsData.trekSlots.map((slot) => (
                <div key={slot.trek_slug} className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {slot.treks?.name || slot.trek_slug}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{slot.available_slots}/{slot.total_slots}</span>
                    {slot.available_slots === 0 ? (
                      <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">Full</span>
                    ) : slot.available_slots <= 2 ? (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full">Low</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.pendingBookings.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm">
                    {analyticsData.pendingBookings.length} pending bookings
                  </span>
                </div>
              )}
              
              {analyticsData.expiringVouchers.length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <Gift className="w-4 h-4 text-orange-600" />
                  <span className="text-sm">
                    {analyticsData.expiringVouchers.length} vouchers expiring soon
                  </span>
                </div>
              )}

              {analyticsData.trekSlots.filter(slot => slot.available_slots <= 2).length > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm">
                    {analyticsData.trekSlots.filter(slot => slot.available_slots <= 2).length} treks low on slots
                  </span>
                </div>
              )}

              {analyticsData.pendingBookings.length === 0 && 
               analyticsData.expiringVouchers.length === 0 && 
               analyticsData.trekSlots.filter(slot => slot.available_slots <= 2).length === 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">All caught up!</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
