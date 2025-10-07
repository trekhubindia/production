'use client';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  User, 
  Mountain, 
  MapPin,
  Eye,
  Search,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';

// Types for booking data
interface Booking {
  id: string;
  trekName: string;
  region: string;
  difficulty: string;
  duration: string;
  altitude: string;
  price: number;
  rating: number;
  image: string;
  trekDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  participants: number;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  customerAge?: number;
  customerDob?: string;
  customerGender?: string;
  medicalConditions?: string;
  trekkingExperience?: string;
  fitnessConsent?: boolean;
  residentialAddress?: string;
  termsAccepted?: boolean;
  liabilityWaiverAccepted?: boolean;
  covidDeclarationAccepted?: boolean;
  specialRequirements?: string;
  gstAmount?: number;
  baseAmount?: number;
  createdAt: string;
  trekSlug: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching bookings...');
        
        const response = await fetch('/api/dashboard/bookings', {
          credentials: 'include', // Ensure cookies are sent
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your bookings');
            return;
          }
          throw new Error(`HTTP ${response.status}: Failed to fetch bookings`);
        }

        const data = await response.json();
        console.log('📊 API Response:', data);
        
        if (data.success) {
          setBookings(data.bookings || []);
          console.log(`✅ Loaded ${data.bookings?.length || 0} bookings`);
        } else {
          throw new Error(data.error || 'Failed to fetch bookings');
        }
      } catch (err) {
        console.error('❌ Error fetching bookings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    const matchesFilter = filter === 'all' || booking.status === filter;
    const matchesSearch = booking.trekName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.region.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  // Calculate stats
  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => ['confirmed', 'pending_approval', 'approved', 'pending'].includes(b.status) && new Date(b.trekDate) > new Date()).length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length
  };

  // Handle view details
  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedBooking(null);
  };

  return (
    <>
      <Head>
        <title>My Bookings | Trek Hub India</title>
        <meta name="description" content="Manage your trek bookings and view booking history" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Page Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
                <p className="text-gray-600 dark:text-gray-300">Track and manage your trekking adventures</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Bookings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-300">Loading bookings...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Error Loading Bookings</h3>
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

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-blue-600 font-medium">Total Bookings</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500 opacity-80" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">{stats.upcoming}</p>
                  <p className="text-sm text-green-600 font-medium">Upcoming</p>
                </div>
                <Clock className="w-8 h-8 text-green-500 opacity-80" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
                  <p className="text-sm text-purple-600 font-medium">Completed</p>
                </div>
                <Mountain className="w-8 h-8 text-purple-500 opacity-80" />
              </div>
            </Card>
            
            <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
                  <p className="text-sm text-red-600 font-medium">Cancelled</p>
                </div>
                <X className="w-8 h-8 text-red-500 opacity-80" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        {!loading && !error && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search bookings by trek name or region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm min-w-[150px]"
                >
                  <option value="all">All Bookings</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          filteredBookings.length > 0 ? (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="p-8 hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left side - Trek image placeholder and details */}
                    <div className="flex items-start gap-6 flex-1">
                      {/* Trek Image */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 shadow-inner">
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
                          <Mountain className="w-12 h-12 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Trek Details */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {booking.trekName}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(booking.difficulty)} w-fit`}>
                            {booking.difficulty}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span>{booking.region}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-green-500" />
                            <span>{new Date(booking.trekDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>{booking.duration}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-purple-500" />
                            <span>{booking.participants} person{booking.participants !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mountain className="w-4 h-4 text-indigo-500" />
                            <span>{booking.altitude}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">Booked on:</span>
                          <span className="font-medium text-gray-700">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right side - Price and status */}
                    <div className="flex flex-col items-end gap-4 lg:min-w-[200px]">
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                        <div className="text-2xl font-bold text-green-600">
                          ₹{booking.totalAmount.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-2">Status</p>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1).replace('_', ' ')}
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleViewDetails(booking)}
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 px-6 py-2 font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Mountain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookings found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'You haven\'t made any bookings yet'
                }
              </p>
            </Card>
          )
        )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetails && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeDetails}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Trek Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trek Information</h3>
                  
                  {/* Trek Image */}
                  {selectedBooking.image && (
                    <div className="mb-4">
                      <img 
                        src={selectedBooking.image} 
                        alt={selectedBooking.trekName}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trek Name:</span>
                      <span className="font-medium">{selectedBooking.trekName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span className="font-medium">{selectedBooking.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Difficulty:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(selectedBooking.difficulty)}`}>
                        {selectedBooking.difficulty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedBooking.duration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Altitude:</span>
                      <span className="font-medium">{selectedBooking.altitude}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trek Date:</span>
                      <span className="font-medium">{new Date(selectedBooking.trekDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Participant Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Participant Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{selectedBooking.customerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBooking.customerEmail || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedBooking.customerPhone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">
                          {selectedBooking.customerAge ? (
                            <span>
                              {selectedBooking.customerAge} years
                              {selectedBooking.customerDob && (
                                <span className="text-xs text-gray-500 ml-1">(calculated from DOB)</span>
                              )}
                            </span>
                          ) : 'N/A'}
                        </span>
                      </div>
                      {selectedBooking.customerDob && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date of Birth:</span>
                          <span className="font-medium">{new Date(selectedBooking.customerDob).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium">{selectedBooking.customerGender || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {selectedBooking.residentialAddress && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Address:</span>
                          <span className="font-medium text-right max-w-xs">{selectedBooking.residentialAddress}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trekking Experience & Medical Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Trekking & Medical Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Experience:</span>
                        <span className="font-medium">{selectedBooking.trekkingExperience || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Participants:</span>
                        <span className="font-medium">{selectedBooking.participants} person{selectedBooking.participants !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    
                    {selectedBooking.medicalConditions && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Medical Conditions:</span>
                          <span className="font-medium text-right max-w-xs">{selectedBooking.medicalConditions}</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Consent & Declarations */}
                    <div className="pt-2 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Consents & Declarations</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fitness Consent:</span>
                          <span className={`font-medium ${selectedBooking.fitnessConsent ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedBooking.fitnessConsent ? '✓ Accepted' : '✗ Not Accepted'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Terms Accepted:</span>
                          <span className={`font-medium ${selectedBooking.termsAccepted ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedBooking.termsAccepted ? '✓ Accepted' : '✗ Not Accepted'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Liability Waiver:</span>
                          <span className={`font-medium ${selectedBooking.liabilityWaiverAccepted ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedBooking.liabilityWaiverAccepted ? '✓ Accepted' : '✗ Not Accepted'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">COVID Declaration:</span>
                          <span className={`font-medium ${selectedBooking.covidDeclarationAccepted ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedBooking.covidDeclarationAccepted ? '✓ Accepted' : '✗ Not Accepted'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking Status & Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Status</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booking ID:</span>
                      <span className="font-mono text-sm">#{selectedBooking.id.slice(0, 9)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="font-medium">{selectedBooking.paymentStatus?.replace('_', ' ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booked On:</span>
                      <span className="font-medium">{new Date(selectedBooking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Special Requirements */}
                {selectedBooking.specialRequirements && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Special Requirements</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedBooking.specialRequirements}</p>
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing Breakdown</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {selectedBooking.baseAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Amount:</span>
                        <span className="font-medium">₹{selectedBooking.baseAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {selectedBooking.gstAmount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">GST (18%):</span>
                        <span className="font-medium">₹{selectedBooking.gstAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-green-600">₹{selectedBooking.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={closeDetails} className="bg-blue-600 hover:bg-blue-700">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
