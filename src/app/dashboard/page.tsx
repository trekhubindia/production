'use client';
import Head from 'next/head';
import { useAuth } from '@/hooks/context/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Mountain, 
  User, 
  Calendar, 
  Heart, 
  Settings, 
  CreditCard, 
  MapPin,
  Clock,
  Star,
  Gift,
  LogOut,
  Edit,
  Eye,
  Download,
  Filter,
  Search,
  Phone,
  XCircle,
  CheckCircle,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Types for API responses
interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  totalSpent: number;
  wishlistCount: number;
  activeVouchers: number;
}

interface RecentBooking {
  id: string;
  trekName: string;
  trekDate: string;
  status: string;
  totalAmount: number;
  region: string;
  difficulty: string;
  duration: string;
  participants: number;
  image?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);

  // Fallback stats for when data is not available
  const displayStats = stats || {
    totalBookings: 0,
    upcomingBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
    wishlistCount: 0,
    activeVouchers: 0
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          console.log('Stats API Response:', statsData);
          if (statsData.success && statsData.stats) {
            setStats(statsData.stats);
          } else {
            console.error('Stats API error:', statsData.error);
            setError(statsData.error || 'Failed to load stats');
          }
        } else {
          console.error('Stats API failed with status:', statsResponse.status);
          setError('Failed to fetch dashboard stats');
        }
        
        // Fetch recent bookings
        const bookingsResponse = await fetch('/api/dashboard/recent-bookings');
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json();
          console.log('Bookings API Response:', bookingsData);
          if (bookingsData.success && bookingsData.bookings) {
            setRecentBookings(bookingsData.bookings);
          } else {
            console.error('Bookings API error:', bookingsData.error);
            setRecentBookings([]);
          }
        } else {
          console.error('Bookings API failed with status:', bookingsResponse.status);
          setRecentBookings([]);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Debug logging
  console.log('Dashboard State:', { loading, error, stats, recentBookings: recentBookings.length });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'moderate':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'difficult':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'pending_approval':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300';
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <>
      <Head>
        <title>My Dashboard | Trek Hub India</title>
        <meta name="description" content="Manage your trekking adventures, bookings, wishlist, and profile on your Trek Hub India dashboard." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Welcome Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || 'Trekker'}!</h1>
                <p className="text-blue-100 text-lg">Ready for your next adventure? Let's explore what's waiting for you.</p>
              </div>
              <div className="hidden md:block">
                <Mountain className="w-24 h-24 text-blue-200 opacity-50" />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-300">Loading dashboard...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Dashboard</h3>
                <p className="text-red-600 dark:text-red-300">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-red-600 hover:bg-red-700"
                >
                  Retry
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Overview */}
          {!loading && !error && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Overview</h2>
                <p className="text-gray-600 dark:text-gray-300">Your trekking journey at a glance</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium mb-1">Total Bookings</p>
                      <p className="text-3xl font-bold text-blue-900">{displayStats.totalBookings}</p>
                      <p className="text-xs text-blue-700 mt-1">All time</p>
                    </div>
                    <div className="bg-blue-500 p-3 rounded-full">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium mb-1">Upcoming Treks</p>
                      <p className="text-3xl font-bold text-green-900">{displayStats.upcomingBookings}</p>
                      <p className="text-xs text-green-700 mt-1">Ready to explore</p>
                    </div>
                    <div className="bg-green-500 p-3 rounded-full">
                      <Mountain className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium mb-1">Completed</p>
                      <p className="text-3xl font-bold text-purple-900">{displayStats.completedBookings}</p>
                      <p className="text-xs text-purple-700 mt-1">Adventures done</p>
                    </div>
                    <div className="bg-purple-500 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 text-sm font-medium mb-1">Total Spent</p>
                      <p className="text-3xl font-bold text-orange-900">₹{displayStats.totalSpent?.toLocaleString() || '0'}</p>
                      <p className="text-xs text-orange-700 mt-1">Investment in memories</p>
                    </div>
                    <div className="bg-orange-500 p-3 rounded-full">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          {!loading && !error && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Recent Bookings</h2>
                  <p className="text-gray-600 dark:text-gray-300">Your latest trekking adventures</p>
                </div>
                <Link href="/dashboard/bookings">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    View All
                  </Button>
                </Link>
              </div>

              {recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <Card key={booking.id} className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 dark:bg-gray-800 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-inner">
                            {booking.image ? (
                              <img 
                                src={booking.image} 
                                alt={booking.trekName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${booking.image ? 'hidden' : ''}`}>
                              <Mountain className="w-8 h-8 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{booking.trekName}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(booking.difficulty)}`}>
                                {booking.difficulty}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {booking.region}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(booking.trekDate).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {booking.duration}
                              </div>
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {booking.participants} person{booking.participants !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            ₹{booking.totalAmount.toLocaleString()}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No bookings yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Start your trekking adventure today!</p>
                  <Link href="/treks">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      Browse Treks
                    </Button>
                  </Link>
                </Card>
              )}
            </div>
          )}

          {/* Quick Actions */}
          {!loading && !error && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quick Actions</h2>
                <p className="text-gray-600 dark:text-gray-300">Manage your trekking experience</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="p-6 hover:shadow-lg transition-all duration-300 group dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-center">
                    <div className="bg-red-100 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                      <Heart className="w-8 h-8 text-red-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {displayStats.wishlistCount ? `${displayStats.wishlistCount} Saved Treks` : 'Build Your Wishlist'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {displayStats.wishlistCount ? 'Your dream adventures await!' : 'Save treks you want to explore!'}
                    </p>
                    <Link href="/dashboard/wishlist">
                      <Button variant="outline" size="sm" className="w-full">
                        <Heart className="w-4 h-4 mr-2" />
                        View Wishlist
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all duration-300 group dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-center">
                    <div className="bg-green-100 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                      <Gift className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {displayStats.activeVouchers ? `${displayStats.activeVouchers} Active Vouchers` : 'No Active Vouchers'}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {displayStats.activeVouchers ? 'Use them on your next trek!' : 'Check for available discounts!'}
                    </p>
                    <Link href="/dashboard/vouchers">
                      <Button variant="outline" size="sm" className="w-full">
                        <Gift className="w-4 h-4 mr-2" />
                        View Vouchers
                      </Button>
                    </Link>
                  </div>
                </Card>

                <Card className="p-6 hover:shadow-lg transition-all duration-300 group dark:bg-gray-800 dark:border-gray-700">
                  <div className="text-center">
                    <div className="bg-blue-100 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                      <Settings className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Profile Settings</h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">Update your preferences and information</p>
                    <Link href="/dashboard/settings">
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Manage Profile
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
