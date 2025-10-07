"use client";
import { useAuth } from "@/hooks/context/AuthContext";
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
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  ArrowLeft,
  Download,
  Filter
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
import { useRouter } from 'next/navigation';
import EnhancedAnalyticsDashboard from "@/components/admin/EnhancedAnalyticsDashboard";
import GoogleAnalyticsDashboard from "@/components/admin/GoogleAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface RealTimeStats {
  today: {
    bookings: number;
    revenue: number;
    bookingChange: number;
    revenueChange: number;
  };
  week: {
    bookings: number;
    revenue: number;
  };
  activeUsers: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: string;
  }>;
  systemHealth: Record<string, string>;
  hourlyBookings: Record<number, number>;
  lastUpdated: string;
}

export default function AdminAnalyticsClient() {
  const { user, initialized } = useAuth();
  const router = useRouter();
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRealTimeStats = async () => {
    try {
      const response = await fetch('/api/admin/analytics/realtime');
      if (response.ok) {
        const data = await response.json();
        setRealTimeStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch real-time stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeStats();
    
    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchRealTimeStats, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (initialized && (!user || (user.role !== "admin" && user.role !== "owner"))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Access Denied</h1>
        <p className="text-lg text-muted-foreground">You do not have permission to access analytics.</p>
      </div>
    );
  }

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

  // Create hourly chart data
  const hourlyChartData = realTimeStats ? {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [{
      label: 'Bookings per Hour',
      data: Array.from({ length: 24 }, (_, i) => realTimeStats.hourlyBookings[i] || 0),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  } : null;

  return (
    <div className="flex flex-col gap-8 py-10 px-4 w-full flex-1 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Advanced Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive business insights and real-time metrics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`w-4 h-4 mr-2 ${autoRefresh ? 'text-green-500' : 'text-gray-500'}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchRealTimeStats}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Stats */}
      {realTimeStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTimeStats.today.bookings}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getGrowthIcon(realTimeStats.today.bookingChange)}
                <span className={getGrowthColor(realTimeStats.today.bookingChange)}>
                  {formatPercentage(realTimeStats.today.bookingChange)}
                </span>
                <span>vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(realTimeStats.today.revenue)}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getGrowthIcon(realTimeStats.today.revenueChange)}
                <span className={getGrowthColor(realTimeStats.today.revenueChange)}>
                  {formatPercentage(realTimeStats.today.revenueChange)}
                </span>
                <span>vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{realTimeStats.activeUsers}</div>
              <div className="text-xs text-muted-foreground">Currently online</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {Object.values(realTimeStats.systemHealth).every(status => status === 'healthy') ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-green-600">All Systems Operational</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">Some Issues Detected</span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Last updated: {new Date(realTimeStats.lastUpdated).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hourly Activity Chart */}
      {hourlyChartData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Today's Hourly Activity
            </CardTitle>
            <CardDescription>Booking activity throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Line 
                data={hourlyChartData} 
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
                        stepSize: 1
                      }
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {realTimeStats && (
        <Card>
          <CardHeader>
            <CardTitle>Live Activity Feed</CardTitle>
            <CardDescription>Real-time booking and user activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {realTimeStats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'confirmed' ? 'bg-green-500' :
                      activity.status === 'pending' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <span className="text-sm">{activity.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">Internal Analytics</TabsTrigger>
          <TabsTrigger value="google">Google Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="internal" className="space-y-6">
          <EnhancedAnalyticsDashboard />
        </TabsContent>
        
        <TabsContent value="google" className="space-y-6">
          <GoogleAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
