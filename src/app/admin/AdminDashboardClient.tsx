"use client";
import { useAuth } from "@/hooks/context/AuthContext";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar, TrendingUp, Users, Plus, Edit, Gift, List, MoreVertical, Sun, Moon, BarChart3 } from "lucide-react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
import { useContext, useState, useEffect } from "react";
import { AdminThemeContext } from "./AdminLayoutClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminWebsiteNavigation from "@/components/AdminWebsiteNavigation";
import { useRouter } from "next/navigation";
import EnhancedAnalyticsDashboard from "@/components/admin/EnhancedAnalyticsDashboard";

interface AdminDashboardClientProps {
  trekCount: number;
  bookingCount: number;
  userCount: number;
  chartData: ChartData<'bar'>;
}

export default function AdminDashboardClient({ trekCount, bookingCount, userCount, chartData }: AdminDashboardClientProps) {
  const { user, initialized, signOut } = useAuth();
  const { theme, toggleTheme } = useContext(AdminThemeContext);
  const router = useRouter();
  const [trekSlots, setTrekSlots] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/analytics/overview');
        if (response.ok) {
          const data = await response.json();
          setTrekSlots(data.trekSlots || []);
          setRecentBookings(data.recentBookings || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (initialized && (!user || (user.role !== "admin" && user.role !== "owner"))) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Access Denied</h1>
        <p className="text-lg text-muted-foreground">You do not have permission to access the admin dashboard.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-10 px-4 w-full flex-1 bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground text-base mt-1">
            Welcome, <span className="font-semibold text-primary">{user?.name || user?.email}</span>! You have admin access.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="theme-toggle-button text-black dark:text-white hover:text-gray-700 dark:hover:text-gray-300 p-2 h-10 w-10 flex items-center justify-center focus:outline-none"
            title="Toggle theme"
            type="button"
          >
            <div className={`theme-toggle-icon transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'rotate-180' : 'rotate-0'}`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreVertical className="w-4 h-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">

              <DropdownMenuItem onClick={() => router.push('/dashboard')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Website Navigation */}
      <AdminWebsiteNavigation />
      
      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Quick Overview</TabsTrigger>
          <TabsTrigger value="analytics">Enhanced Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Upcoming Treks</CardTitle>
            <Calendar className="w-5 h-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{trekCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Next 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Monthly Bookings</CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{bookingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹1,20,000</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-foreground">New Users</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{userCount}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>
      {/* Charts & Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="min-h-[300px] bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Bookings per Trek</CardTitle>
            <CardDescription className="text-muted-foreground">Bar chart</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <Bar data={chartData as ChartData<'bar'>} options={{ plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }} height={180} />
          </CardContent>
        </Card>
        <Card className="min-h-[300px] bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Trend</CardTitle>
            <CardDescription className="text-muted-foreground">Line chart placeholder</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48 text-muted-foreground">[Chart]</CardContent>
        </Card>
      </div>
      {/* Activity Feed & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-2 bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <CardDescription className="text-muted-foreground">Latest bookings, edits, vouchers, users</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 max-h-64 overflow-y-auto text-muted-foreground">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : recentBookings.length > 0 ? (
              recentBookings.slice(0, 4).map((booking) => (
                <div key={booking.id} className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-primary" />
                  {booking.customer_name} booked {booking.trek_name}
                  <span className="ml-auto text-xs">
                    {new Date(booking.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No recent activity</div>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-2 bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={() => router.push('/admin/treks/new')}
            >
              <Plus /> Add New Trek
            </Button>
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={() => router.push('/admin/blogs/new')}
            >
              <Edit /> Post a Blog
            </Button>
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={() => router.push('/admin/vouchers')}
            >
              <Gift /> Create Voucher
            </Button>
            <Button 
              variant="default" 
              className="w-full gap-2"
              onClick={() => router.push('/admin/analytics')}
            >
              <BarChart3 /> View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* Trek Slot Monitor, Pending Actions, Voucher Expiry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Trek Slot Monitor</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-muted-foreground">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : trekSlots.length > 0 ? (
              trekSlots.slice(0, 4).map((slot) => (
                <div key={slot.trek_slug} className="flex items-center gap-2">
                  {slot.treks?.name || slot.trek_slug}
                  <span className="ml-auto">
                    {slot.available_slots} slots
                    {slot.available_slots === 0 && (
                      <span className="text-destructive font-bold ml-2">Full</span>
                    )}
                    {slot.available_slots > 0 && slot.available_slots <= 2 && (
                      <span className="text-yellow-500 font-bold ml-2">Low</span>
                    )}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No trek slots data</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">Review 5 new bookings <span className="ml-auto text-xs">High</span></div>
            <div className="flex items-center gap-2">Update trek availability <span className="ml-auto text-xs">Medium</span></div>
            <div className="flex items-center gap-2">Approve user registrations <span className="ml-auto text-xs">Low</span></div>
            <div className="flex items-center gap-2">Process refunds <span className="ml-auto text-xs">High</span></div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-border shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.7)]">
          <CardHeader>
            <CardTitle className="text-foreground">Voucher Expiry</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-muted-foreground">
            <div className="flex items-center gap-2">SUMMER20 <span className="ml-auto">2 days</span></div>
            <div className="flex items-center gap-2">WELCOME10 <span className="ml-auto">5 days</span></div>
            <div className="flex items-center gap-2">MONSOON15 <span className="ml-auto">1 week</span></div>
            <div className="flex items-center gap-2">FESTIVAL25 <span className="ml-auto">2 weeks</span></div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <EnhancedAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
} 