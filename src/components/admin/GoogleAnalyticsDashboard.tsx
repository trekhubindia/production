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
  Eye, 
  MousePointer,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  AlertTriangle,
  Globe,
  BarChart3,
  PieChart,
  LineChart,
  Activity
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

interface GoogleAnalyticsData {
  overview: {
    current: {
      sessions: number;
      users: number;
      pageviews: number;
      bounceRate: number;
      avgSessionDuration: number;
      newUsers: number;
    };
    previous: {
      sessions: number;
      users: number;
      pageviews: number;
      bounceRate: number;
      avgSessionDuration: number;
      newUsers: number;
    };
    growth: {
      sessions: number;
      users: number;
      pageviews: number;
      bounceRate: number;
      newUsers: number;
    };
  };
  pageViews: Array<{
    page: string;
    views: number;
    uniqueViews: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
    users: number;
  }>;
  deviceData: Array<{
    deviceCategory: string;
    sessions: number;
    percentage: number;
  }>;
  activeUsers: number;
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
    compareStartDate: string;
    compareEndDate: string;
  };
}

export default function GoogleAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<GoogleAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30days');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await fetch(`/api/admin/analytics/google?type=all&period=${period}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Failed to fetch Google Analytics:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // Create chart data
  const trafficSourcesChartData = analyticsData ? {
    labels: analyticsData.trafficSources.map(source => source.source),
    datasets: [{
      label: 'Sessions',
      data: analyticsData.trafficSources.map(source => source.sessions),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(251, 191, 36, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)',
      ],
      borderWidth: 1
    }]
  } : null;

  const deviceChartData = analyticsData ? {
    labels: analyticsData.deviceData.map(device => device.deviceCategory),
    datasets: [{
      label: 'Sessions',
      data: analyticsData.deviceData.map(device => device.sessions),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(251, 191, 36, 0.8)',
      ],
      borderWidth: 1
    }]
  } : null;

  const pageViewsChartData = analyticsData ? {
    labels: analyticsData.pageViews.map(page => 
      page.page.length > 25 ? page.page.substring(0, 25) + '...' : page.page
    ),
    datasets: [{
      label: 'Page Views',
      data: analyticsData.pageViews.map(page => page.views),
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: 'rgb(139, 92, 246)',
      borderWidth: 1
    }]
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Google Analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Google Analytics Error</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchAnalytics}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-muted-foreground">Unable to load Google Analytics data</p>
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6" />
            Google Analytics
          </h2>
          <p className="text-muted-foreground">Website traffic and user behavior insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Days</SelectItem>
              <SelectItem value="30days">30 Days</SelectItem>
              <SelectItem value="90days">90 Days</SelectItem>
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
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.current.sessions)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.growth.sessions)}
              <span className={getGrowthColor(overview.growth.sessions)}>
                {formatPercentage(overview.growth.sessions)}
              </span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.current.users)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.growth.users)}
              <span className={getGrowthColor(overview.growth.users)}>
                {formatPercentage(overview.growth.users)}
              </span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.current.pageviews)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.growth.pageviews)}
              <span className={getGrowthColor(overview.growth.pageviews)}>
                {formatPercentage(overview.growth.pageviews)}
              </span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
            <div className="text-xs text-muted-foreground">Currently online</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(overview.current.bounceRate * 100).toFixed(1)}%</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(-overview.growth.bounceRate)} {/* Negative because lower bounce rate is better */}
              <span className={getGrowthColor(-overview.growth.bounceRate)}>
                {formatPercentage(overview.growth.bounceRate)}
              </span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(overview.current.avgSessionDuration)}</div>
            <div className="text-xs text-muted-foreground">Average time on site</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.current.newUsers)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getGrowthIcon(overview.growth.newUsers)}
              <span className={getGrowthColor(overview.growth.newUsers)}>
                {formatPercentage(overview.growth.newUsers)}
              </span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        {trafficSourcesChartData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Traffic Sources
              </CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut 
                  data={trafficSourcesChartData} 
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

        {/* Device Categories */}
        {deviceChartData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device Categories
              </CardTitle>
              <CardDescription>Visitor device breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <Doughnut 
                  data={deviceChartData} 
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
      </div>

      {/* Top Pages */}
      {pageViewsChartData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Pages
            </CardTitle>
            <CardDescription>Most viewed pages on your website</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar 
                data={pageViewsChartData} 
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

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
            <CardDescription>Most popular pages by views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.pageViews.map((page, index) => (
                <div key={page.page} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium text-sm">{page.page}</div>
                    <div className="text-xs text-muted-foreground">{page.uniqueViews} unique views</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatNumber(page.views)}</div>
                    <div className="text-xs text-muted-foreground">views</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Traffic Sources Table */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Sources</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.trafficSources.map((source) => (
                <div key={source.source} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium text-sm capitalize">{source.source}</div>
                    <div className="text-xs text-muted-foreground">{formatNumber(source.users)} users</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-sm">{formatNumber(source.sessions)}</div>
                    <div className="text-xs text-muted-foreground">sessions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
