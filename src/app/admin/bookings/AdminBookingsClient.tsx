'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  Calendar,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  FileText,
  CalendarDays,
  UserX,
  Bell,
  X,
  Download,
  Save,
  Filter,
  BarChart3
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { RealtimeStatusIndicator } from '@/components/RealtimeStatusIndicator';
import { supabase } from '@/lib/supabase';
import BookingExportModal from '@/components/admin/BookingExportModal';

interface Booking {
  customer_email?: string;
  customer_phone?: string;
  special_requirements?: string;
  pickup_location?: string;
  id: string;
  customer_name?: string;
  user_id?: string;
  trek_name?: string;
  trek_id?: string;
  trek_slug?: string;
  trek_date?: string;
  booking_date?: string;
  participants?: number;
  status?: string;
  created_at?: string;
  // Joined trek data
  treks?: {
    id: string;
    name: string;
    slug: string;
    region: string;
    difficulty: string;
    duration: string;
    price: string;
  };
  // Joined trek slot data
  trek_slots?: {
    id: string;
    date: string;
    capacity: number;
    booked: number;
    status: string;
  };
  // Joined user profile data - flexible interface to handle any fields
  user_profiles?: {
    id?: string;
    user_id?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    phone_number?: string;
    mobile?: string;
    gender?: string;
    date_of_birth?: string;
    dob?: string;
    country?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact?: string;
    medical_conditions?: string;
    health_conditions?: string;
    dietary_restrictions?: string;
    dietary_preferences?: string;
    trekking_experience?: string;
    experience_level?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any; // Allow any additional fields
  };
  // Add other properties as needed
}

interface AdminBookingsClientProps {
  bookings: Booking[];
}

// Helper functions for formatting
const formatKeyLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
};

const formatValueForDisplay = (key: string, value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (key.includes('date') || key.includes('_at')) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  }
  if (key.includes('amount') || key.includes('price')) {
    return `₹${value}`;
  }
  return String(value);
};

// Field grouping for better organization - optimized to show only relevant fields
const getFieldGroup = (key: string): string => {
  if (['customer_name', 'customer_email', 'customer_phone', 'customer_dob', 'customer_gender', 'customer_nationality'].includes(key)) {
    return 'Customer Info';
  }
  if (['trek_slug', 'booking_date', 'participants', 'slot_id'].includes(key)) {
    return 'Trek Details';
  }
  if (['status', 'payment_status', 'total_amount', 'base_amount', 'gst_amount'].includes(key)) {
    return 'Payment & Status';
  }
  if (['special_requirements', 'pickup_point', 'medical_conditions', 'trekking_experience', 'dietary_requirements', 'emergency_contact_name', 'emergency_contact_phone'].includes(key)) {
    return 'Additional Info';
  }
  if (['fitness_consent', 'terms_accepted', 'liability_waiver_accepted', 'covid_declaration_accepted'].includes(key)) {
    return 'Consents';
  }
  if (['id', 'user_id', 'created_at', 'updated_at'].includes(key)) {
    return 'System Info';
  }
  return 'Other';
};

// Fields to exclude from the detailed view (unused or redundant fields)
const excludedFields = [
  'payment_intent_id',
  'payment_amount', 
  'advance_amount',
  'remaining_amount',
  'payment_type',
  'recent_illnesses',
  'current_medications',
  'id_proof_file_url',
  'trek_gear_rental',
  'porter_services',
  'addon_details',
  'notes',
  'customer_age', // Redundant with customer_dob
  'accommodation_preferences', // Use accommodation_preference instead
  'emergency_contact', // Use emergency_contact_name/phone instead
  'pickup_location' // Use pickup_point instead
];

export default function AdminBookingsClient({ bookings: initialBookings }: AdminBookingsClientProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [newBookingNotification, setNewBookingNotification] = useState<Booking | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, unknown>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Real-time booking update handler
  const handleBookingUpdate = useCallback((booking: Booking, event: string) => {
    console.log('[RT] Admin Bookings: Booking update received:', booking, event);
    
    if (event === 'INSERT') {
      // New booking added
      const newBooking: Booking = {
        id: booking.id,
        customer_name: booking.customer_name || booking.customer_email || booking.user_id,
        user_id: booking.user_id,
        trek_name: booking.treks?.name || booking.trek_name,
        trek_id: booking.trek_id,
        trek_date: booking.trek_slots?.date || booking.trek_date || booking.booking_date,
        booking_date: booking.booking_date,
        participants: booking.participants,
        status: booking.status,
        created_at: booking.created_at,
      };
      
      setBookings(prev => [newBooking, ...prev]);
      setNewBookingNotification(newBooking);
      
      // Show notification for 5 seconds
      setTimeout(() => {
        setNewBookingNotification(null);
      }, 5000);
      
      setMessage({ type: 'success', text: `New booking received from ${newBooking.customer_name || 'Customer'}` });
    } else if (event === 'UPDATE') {
      // Booking updated
      setBookings(prev => prev.map(b => 
        b.id === booking.id 
          ? { ...b, ...booking, customer_name: booking.customer_name || booking.customer_email || booking.user_id }
          : b
      ));
    } else if (event === 'DELETE') {
      // Booking deleted
      setBookings(prev => prev.filter(b => b.id !== booking.id));
    }
  }, []);

  // Set up real-time subscriptions
  const { error: realtimeError } = useRealtimeData({
    onBookingUpdate: handleBookingUpdate,
    enableBookings: true,
    enableTrekSlots: false,
    enableUserProfiles: false,
    enableAuthUsers: false,
    isAdmin: true,
  });

  // Also subscribe to admin broadcast channel as fallback
  useEffect(() => {
    const channel = supabase.channel('admin_bookings');
    channel.on('broadcast', { event: 'new-booking' }, (payload: { payload: { booking: Booking } }) => {
      const booking = payload?.payload?.booking;
      if (!booking) return;
      handleBookingUpdate(booking, 'INSERT');
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleBookingUpdate]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // View details modal
  const openDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedBooking({ ...booking, ...data.booking });
      }
    } catch {}
    setDetailsOpen(true);
  };

  // Edit modal
  const openEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditForm({
      customer_name: booking.customer_name || '',
      customer_email: (booking as Booking).customer_email || '',
      customer_phone: (booking as Booking).customer_phone || '',
      participants: booking.participants || 1,
      booking_date: booking.booking_date || booking.trek_date || '',
      special_requirements: (booking as Booking).special_requirements || '',
      pickup_location: (booking as Booking).pickup_location || '',
    });
    setEditOpen(true);
  };

  const handleEditChange = (field: string, value: unknown) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const submitEdit = async () => {
    if (!selectedBooking) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update booking' });
      } else {
        const updated = data.booking;
        setBookings(prev => prev.map(b => (b.id === updated.id ? { ...b, ...updated } : b)));
        setMessage({ type: 'success', text: 'Booking updated' });
        setEditOpen(false);
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update booking' });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Delete this booking? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
      if (res.ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setMessage({ type: 'success', text: 'Booking deleted' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete' });
    }
  };


  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.treks?.name || booking.trek_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.user_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    const matchesDate = dateFilter === 'all' || 
      (dateFilter === 'today' && booking.trek_date && new Date(booking.trek_date).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'upcoming' && booking.trek_date && new Date(booking.trek_date) > new Date()) ||
      (dateFilter === 'past' && booking.trek_date && new Date(booking.trek_date) < new Date());
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const stats = {
    total: bookings.length,
    pending_approval: bookings.filter(b => b.status === 'pending_approval').length,
    approved: bookings.filter(b => b.status === 'approved').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    today: bookings.filter(b => b.trek_date && new Date(b.trek_date).toDateString() === new Date().toDateString()).length,
    upcoming: bookings.filter(b => b.trek_date && new Date(b.trek_date) > new Date()).length
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'approved':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'completed':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'refunded':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending_approval':
        return <Bell className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  // Helpers to render detailed key-value list
  const formatKeyLabel = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatValueForDisplay = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') return '-';
    const lowerKey = key.toLowerCase();
    if (typeof value === 'string') {
      if (
        lowerKey.includes('date') ||
        lowerKey.includes('created') ||
        lowerKey.includes('updated')
      ) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleString();
      }
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Booking status updated to ${newStatus}` });
        // Update local state instead of reloading
        setBookings(prev => prev.map(b => 
          b.id === bookingId ? { ...b, status: newStatus } : b
        ));
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to update booking status' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update booking status' });
    } finally {
      setUpdatingStatus(null);
    }
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                Booking Management
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage and track all trek bookings</p>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeStatusIndicator 
                className="text-sm" 
                enableBookings={true}
                enableTrekSlots={false}
                enableUserProfiles={false}
                enableAuthUsers={false}
                isAdmin={true}
              />
              <button
                onClick={() => setExportOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              {realtimeError && (
                <div className="text-red-600 text-sm">
                  Real-time connection error
                </div>
              )}
            </div>
          </div>

          {/* New Booking Notification */}
          <AnimatePresence>
            {newBookingNotification && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      New Booking Received!
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300 text-sm">
                      {newBookingNotification.customer_name || 'Customer'} booked {newBookingNotification.treks?.name || newBookingNotification.trek_name || 'a trek'} 
                      for {newBookingNotification.participants || 0} participants
                    </p>
                  </div>
                  <button
                    onClick={() => setNewBookingNotification(null)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Confirmed</p>
                    <p className="text-3xl font-bold text-foreground">{stats.confirmed}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Cancelled</p>
                    <p className="text-3xl font-bold text-foreground">{stats.cancelled}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                    <UserX className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Today</p>
                    <p className="text-3xl font-bold text-foreground">{stats.today}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <CalendarDays className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Upcoming</p>
                    <p className="text-3xl font-bold text-foreground">{stats.upcoming}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Display */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 rounded-xl border ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {message.text}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search and Filter */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search bookings by customer name, trek name, or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              >
                <option value="all">All Status</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-6 py-4 bg-background border border-input rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-300"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
              <div className="flex bg-muted rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'cards' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-3 rounded-lg transition-all duration-300 ${
                    viewMode === 'table' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Bookings Display */}
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">No bookings found</h3>
              <p className="text-muted-foreground text-lg">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'No bookings available'
                }
              </p>
            </div>
          ) : viewMode === 'cards' ? (
            /* Cards View */
            <div className="grid gap-6">
              <AnimatePresence>
                {filteredBookings.map((booking, index) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    layout
                  >
                    <Card className="hover:shadow-md transition-all duration-300 group cursor-pointer" onClick={() => openDetails(booking)}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header with Customer & Status */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                {booking.user_profiles?.full_name || booking.customer_name || 'Unknown Customer'}
                              </h3>
                              <div className="text-sm text-muted-foreground">
                                {booking.user_profiles?.email || (booking as any).customer_email || ''}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className={`px-3 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getStatusColor(booking.status || '')}`}>
                                {getStatusIcon(booking.status || '')}
                                {booking.status || 'Unknown'}
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor((booking as any).payment_status || '')}`}>
                                {(booking as any).payment_status || 'Unknown'}
                              </div>
                            </div>
                          </div>

                          {/* Trek Information */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{booking.treks?.name || booking.trek_name || 'Unknown Trek'}</span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {booking.trek_date ? new Date(booking.trek_date).toLocaleDateString() : 'No date'}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {booking.participants || 0} participants
                              </div>
                              {booking.treks?.region && (
                                <div className="text-xs px-2 py-1 bg-muted rounded-full">
                                  {booking.treks.region}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment Information */}
                          <div className="flex items-center justify-between pt-2 border-t border-border">
                            <div className="space-y-1">
                              <div className="text-lg font-semibold text-foreground">
                                ₹{(booking as any).total_amount || '-'}
                              </div>
                              {(booking as any).base_amount && (booking as any).gst_amount && (
                                <div className="text-xs text-muted-foreground">
                                  Base: ₹{(booking as any).base_amount} + GST: ₹{(booking as any).gst_amount}
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm text-muted-foreground">
                                Created: {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Table View */
            <Card className="hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
          <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Trek</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Trek Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Participants</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Payment</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Created</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => openDetails(booking)}>
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="space-y-1">
                              <div>{booking.user_profiles?.full_name || booking.customer_name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{booking.user_profiles?.email || (booking as any).customer_email || ''}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <div className="space-y-1">
                              <div className="font-medium">{booking.treks?.name || booking.trek_name || 'Unknown Trek'}</div>
                              <div className="text-xs text-muted-foreground">{booking.treks?.region || ''}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {booking.trek_date ? new Date(booking.trek_date).toLocaleDateString() : 'No date'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-center">
                            {booking.participants || 0}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            <div className="font-medium">₹{(booking as any).total_amount || '-'}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getPaymentStatusColor((booking as any).payment_status || '')}`}>
                              {(booking as any).payment_status || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getStatusColor(booking.status || '')}`}>
                              {getStatusIcon(booking.status || '')}
                              {booking.status || 'Unknown'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'Unknown'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                               <button className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-muted" onClick={(e) => { e.stopPropagation(); openDetails(booking); }}>
                                  <Eye className="w-4 h-4" />
                               </button>
                                <button onClick={(e) => { e.stopPropagation(); openEdit(booking); }} className="p-2 text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-muted">
                                  <Edit className="w-4 h-4" />
                               </button>
                               {/* Status Update Buttons */}
                                {booking.status !== 'confirmed' && (
                                 <button
                                    onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'confirmed'); }}
                                   disabled={updatingStatus === booking.id}
                                   className="p-2 text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-muted disabled:opacity-50"
                                   title="Confirm Booking"
                                 >
                                   <CheckCircle className="w-4 h-4" />
                                 </button>
                               )}
                                {booking.status !== 'cancelled' && (
                                 <button
                                    onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'cancelled'); }}
                                   disabled={updatingStatus === booking.id}
                                   className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-muted disabled:opacity-50"
                                   title="Cancel Booking"
                                 >
                                   <UserX className="w-4 h-4" />
                                 </button>
                               )}
                                {booking.status !== 'pending' && (
                                 <button
                                    onClick={(e) => { e.stopPropagation(); updateBookingStatus(booking.id, 'pending'); }}
                                   disabled={updatingStatus === booking.id}
                                   className="p-2 text-muted-foreground hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors rounded-lg hover:bg-muted disabled:opacity-50"
                                   title="Set to Pending"
                                 >
                                   <Clock className="w-4 h-4" />
                                 </button>
                               )}
                                 <button onClick={(e) => { e.stopPropagation(); deleteBooking(booking.id); }} className="p-2 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-muted">
                                  <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                </td>
              </tr>
                      ))}
          </tbody>
        </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Details Modal */}
          {detailsOpen && selectedBooking && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-4xl max-h-[90vh] bg-background rounded-xl border border-border overflow-hidden flex flex-col">
                {/* Fixed Header */}
                <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                  <h3 className="text-xl font-semibold">Booking Details</h3>
                  <button onClick={() => setDetailsOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Horizontal Layout - Two Main Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Customer Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Customer Information</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">
                            {selectedBooking.user_profiles?.full_name || 
                             (selectedBooking.user_profiles?.first_name && selectedBooking.user_profiles?.last_name ? 
                              `${selectedBooking.user_profiles.first_name} ${selectedBooking.user_profiles.last_name}` : 
                              selectedBooking.customer_name || 'Unknown Customer')}
                          </span></div>
                          
                          <div><span className="text-muted-foreground">Email:</span> {selectedBooking.user_profiles?.email || (selectedBooking as Booking).customer_email || '-'}</div>
                          
                          <div><span className="text-muted-foreground">Phone:</span> {
                            selectedBooking.user_profiles?.phone || 
                            selectedBooking.user_profiles?.phone_number || 
                            selectedBooking.user_profiles?.mobile || 
                            (selectedBooking as Booking).customer_phone || '-'
                          }</div>
                          
                          <div><span className="text-muted-foreground">Gender:</span> {selectedBooking.user_profiles?.gender || (selectedBooking as any).customer_gender || '-'}</div>
                          
                          <div><span className="text-muted-foreground">Date of Birth:</span> {
                            selectedBooking.user_profiles?.date_of_birth ? new Date(selectedBooking.user_profiles.date_of_birth).toLocaleDateString() :
                            selectedBooking.user_profiles?.dob ? new Date(selectedBooking.user_profiles.dob).toLocaleDateString() :
                            ((selectedBooking as any).customer_dob ? new Date((selectedBooking as any).customer_dob).toLocaleDateString() : '-')
                          }</div>
                          
                          <div><span className="text-muted-foreground">Country:</span> {
                            (selectedBooking as any).customer_country ||
                            selectedBooking.user_profiles?.country || '-'
                          }</div>
                          
                          {/* Address Information */}
                          <div><span className="text-muted-foreground">Address:</span> 
                            <div className="mt-1 text-foreground">
                              {/* Street Address */}
                              {((selectedBooking as any).residential_address || selectedBooking.user_profiles?.address) && (
                                <div>{(selectedBooking as any).residential_address || selectedBooking.user_profiles?.address}</div>
                              )}
                              
                              {/* City, State */}
                              {((selectedBooking as any).customer_city || (selectedBooking as any).customer_state || selectedBooking.user_profiles?.city || selectedBooking.user_profiles?.state) && (
                                <div>
                                  {(selectedBooking as any).customer_city || selectedBooking.user_profiles?.city}
                                  {((selectedBooking as any).customer_city || selectedBooking.user_profiles?.city) && 
                                   ((selectedBooking as any).customer_state || selectedBooking.user_profiles?.state) ? ', ' : ''}
                                  {(selectedBooking as any).customer_state || selectedBooking.user_profiles?.state}
                                </div>
                              )}
                              
                              {/* Postal Code */}
                              {((selectedBooking as any).customer_postal_code || selectedBooking.user_profiles?.postal_code) && (
                                <div>{(selectedBooking as any).customer_postal_code || selectedBooking.user_profiles?.postal_code}</div>
                              )}
                              
                              {/* Show "Not provided" if no address info */}
                              {!((selectedBooking as any).residential_address || selectedBooking.user_profiles?.address || 
                                 (selectedBooking as any).customer_city || selectedBooking.user_profiles?.city ||
                                 (selectedBooking as any).customer_state || selectedBooking.user_profiles?.state ||
                                 (selectedBooking as any).customer_postal_code || selectedBooking.user_profiles?.postal_code) && (
                                <div className="text-muted-foreground">Not provided</div>
                              )}
                            </div>
                          </div>
                          
                          {/* Emergency Contact */}
                          {(selectedBooking.user_profiles?.emergency_contact_name || selectedBooking.user_profiles?.emergency_contact) && (
                            <div><span className="text-muted-foreground">Emergency Contact:</span> 
                              <div className="mt-1 text-foreground">
                                {selectedBooking.user_profiles?.emergency_contact_name || selectedBooking.user_profiles?.emergency_contact}
                                {selectedBooking.user_profiles?.emergency_contact_phone && ` (${selectedBooking.user_profiles.emergency_contact_phone})`}
                              </div>
                            </div>
                          )}
                          
                          {/* Profile Creation Date */}
                          {selectedBooking.user_profiles?.created_at && (
                            <div><span className="text-muted-foreground">Profile Created:</span> {new Date(selectedBooking.user_profiles.created_at).toLocaleDateString()}</div>
                          )}
                        </div>
                </div>

                      {/* Trek Information */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Trek Information</h4>
                        <div className="grid grid-cols-1 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Trek Name:</span> <span className="font-medium">{selectedBooking.treks?.name || 'Unknown Trek'}</span></div>
                        <div><span className="text-muted-foreground">Region:</span> {selectedBooking.treks?.region || '-'}</div>
                        <div><span className="text-muted-foreground">Difficulty:</span> {selectedBooking.treks?.difficulty || '-'}</div>
                        <div><span className="text-muted-foreground">Duration:</span> {selectedBooking.treks?.duration || '-'}</div>
                        <div><span className="text-muted-foreground">Trek Date:</span> <span className="font-medium">{selectedBooking.trek_date ? new Date(selectedBooking.trek_date).toLocaleDateString() : 'No date'}</span></div>
                        <div><span className="text-muted-foreground">Participants:</span> <span className="font-medium">{selectedBooking.participants ?? '-'}</span></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Booking Status & Payment */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Booking Status & Payment</h4>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Status:</span> 
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold border inline-flex items-center gap-1 ${getStatusColor(selectedBooking.status || '')}`}>
                            {getStatusIcon(selectedBooking.status || '')}
                            {selectedBooking.status || 'Unknown'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Payment:</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor((selectedBooking as any).payment_status || '')}`}>
                            {(selectedBooking as any).payment_status || 'Unknown'}
                          </div>
                        </div>
                        <div><span className="text-muted-foreground">Total Amount:</span> <span className="font-semibold text-lg">₹{(selectedBooking as any).total_amount || '-'}</span></div>
                        {(selectedBooking as any).base_amount && (
                          <div><span className="text-muted-foreground">Base Amount:</span> ₹{(selectedBooking as any).base_amount}</div>
                        )}
                        {(selectedBooking as any).gst_amount && (
                          <div><span className="text-muted-foreground">GST Amount:</span> ₹{(selectedBooking as any).gst_amount}</div>
                        )}
                        <div><span className="text-muted-foreground">Created:</span> {selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleString() : '-'}</div>
                        <div><span className="text-muted-foreground">Updated:</span> {(selectedBooking as any).updated_at ? new Date((selectedBooking as any).updated_at).toLocaleString() : '-'}</div>
                      </div>
                    </div>

                    {/* Additional Information - Cleaned up */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-foreground border-b border-border pb-1">Additional Information</h4>
                      <div className="space-y-2 text-sm">
                        {(selectedBooking as Booking).special_requirements && (
                          <div><span className="text-muted-foreground">Special Requirements:</span> <div className="mt-1 text-foreground">{(selectedBooking as Booking).special_requirements}</div></div>
                        )}
                        
                        {((selectedBooking as any).pickup_point || (selectedBooking as any).pickup_location) && (
                          <div><span className="text-muted-foreground">Pickup Location:</span> <div className="mt-1 text-foreground">{
                            (selectedBooking as any).pickup_point || (selectedBooking as any).pickup_location
                          }</div></div>
                        )}
                        
                        {(selectedBooking.user_profiles?.medical_conditions || (selectedBooking as any).medical_conditions) && (
                          <div><span className="text-muted-foreground">Medical Conditions:</span> <div className="mt-1 text-foreground">{
                            selectedBooking.user_profiles?.medical_conditions || (selectedBooking as any).medical_conditions
                          }</div></div>
                        )}
                        
                        {(selectedBooking.user_profiles?.trekking_experience || (selectedBooking as any).trekking_experience) && (
                          <div><span className="text-muted-foreground">Trekking Experience:</span> <div className="mt-1 text-foreground">{
                            selectedBooking.user_profiles?.trekking_experience || (selectedBooking as any).trekking_experience
                          }</div></div>
                        )}
                        
                        {((selectedBooking as any).emergency_contact_name || (selectedBooking as any).emergency_contact_phone) && (
                          <div><span className="text-muted-foreground">Emergency Contact:</span> <div className="mt-1 text-foreground">{
                            (selectedBooking as any).emergency_contact_name ? 
                            `${(selectedBooking as any).emergency_contact_name}${(selectedBooking as any).emergency_contact_phone ? ` (${(selectedBooking as any).emergency_contact_phone})` : ''}` :
                            (selectedBooking as any).emergency_contact_phone
                          }</div></div>
                        )}
                        
                        {((selectedBooking as any).dietary_requirements || selectedBooking.user_profiles?.dietary_restrictions) && (
                          <div><span className="text-muted-foreground">Dietary Requirements:</span> <div className="mt-1 text-foreground">{
                            (selectedBooking as any).dietary_requirements || selectedBooking.user_profiles?.dietary_restrictions
                          }</div></div>
                        )}
                        
                        {(selectedBooking as any).needs_transportation && (
                          <div><span className="text-muted-foreground">Transportation Needed:</span> <div className="mt-1 text-foreground">Yes</div></div>
                        )}
                        
                        {/* Consent Information */}
                        <div className="pt-2 border-t border-border/50">
                          <h5 className="text-xs font-semibold text-muted-foreground mb-2">Consents</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${(selectedBooking as any).fitness_consent ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              Fitness Consent
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${(selectedBooking as any).terms_accepted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              Terms Accepted
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${(selectedBooking as any).liability_waiver_accepted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              Liability Waiver
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${(selectedBooking as any).covid_declaration_accepted ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              COVID Declaration
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Full-width All Fields Section - Filtered */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold mb-2">All Fields (Grouped)</h4>
                  <div className="max-h-60 overflow-auto pr-1 space-y-3">
                    {Object.entries(
                      Object.entries(selectedBooking)
                        .filter(([key]) => 
                          !['treks', 'trek_slots', 'user_profiles'].includes(key) && // Exclude nested objects
                          !excludedFields.includes(key) && // Exclude unused fields
                          selectedBooking[key as keyof typeof selectedBooking] !== null &&
                          selectedBooking[key as keyof typeof selectedBooking] !== undefined &&
                          selectedBooking[key as keyof typeof selectedBooking] !== ''
                        ) // Only show fields with values
                        .reduce((groups, [key, value]) => {
                          const group = getFieldGroup(key);
                          if (!groups[group]) groups[group] = [];
                          groups[group].push([key, value]);
                          return groups;
                        }, {} as Record<string, [string, any][]>)
                    )
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([groupName, fields]) => (
                      <div key={groupName} className="space-y-2">
                        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50 pb-1">
                          {groupName}
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {fields
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([key, value]) => (
                              <div key={key} className="flex items-start gap-2">
                                <span className="text-muted-foreground whitespace-nowrap min-w-0 flex-shrink-0">
                                  {formatKeyLabel(key)}:
                                </span>
                                <span className="break-all min-w-0 flex-1">
                                  {formatValueForDisplay(key, value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal */}
          {editOpen && selectedBooking && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
              <div className="w-full max-w-2xl bg-background rounded-xl border border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Edit Booking</h3>
                  <button onClick={() => setEditOpen(false)} className="p-2 hover:bg-muted rounded-lg"><X className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block text-muted-foreground mb-1">Customer Name</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.customer_name as string || ''} onChange={(e) => handleEditChange('customer_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Email</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.customer_email as string || ''} onChange={(e) => handleEditChange('customer_email', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Phone</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.customer_phone as string || ''} onChange={(e) => handleEditChange('customer_phone', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1">Participants</label>
                    <input type="number" min={1} className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={typeof editForm.participants === 'number' ? editForm.participants : Number(editForm.participants) || 1} onChange={(e) => handleEditChange('participants', Number(e.target.value))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-muted-foreground mb-1">Booking Date</label>
                    <input type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.booking_date as string || ''} onChange={(e) => handleEditChange('booking_date', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-muted-foreground mb-1">Special Requirements</label>
                    <textarea className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.special_requirements as string || ''} onChange={(e) => handleEditChange('special_requirements', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-muted-foreground mb-1">Pickup Location</label>
                    <input className="w-full px-3 py-2 rounded-lg border border-input bg-background" value={editForm.pickup_location as string || ''} onChange={(e) => handleEditChange('pickup_location', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button onClick={() => setEditOpen(false)} className="px-4 py-2 rounded-lg border">Cancel</button>
                  <button onClick={submitEdit} disabled={savingEdit} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50"><Save className="w-4 h-4" /> {savingEdit ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Export Modal */}
          <BookingExportModal
            isOpen={exportOpen}
            onClose={() => setExportOpen(false)}
            totalBookings={stats.total}
            bookingStats={{
              pending_approval: stats.pending_approval,
              confirmed: stats.confirmed,
              completed: stats.completed,
              cancelled: stats.cancelled
            }}
          />
        </motion.div>
      </div>
    </div>
  );
} 