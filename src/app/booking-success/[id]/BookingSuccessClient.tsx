'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SmartNavigation } from '@/lib/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  Calendar, 
  Users, 
  MapPin, 
  Mail, 
  Phone,
  FileText,
  ArrowRight,
  Home,
  User,
  Mountain
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Footer from '@/components/Footer';

interface BookingDetails {
  id: string;
  trek_name: string;
  trek_slug: string;
  booking_date: string;
  participants: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  total_amount: number;
  status: string;
  created_at: string;
  special_requirements?: string;
}

interface BookingSuccessClientProps {
  bookingId: string;
}

export default function BookingSuccessClient({ bookingId }: BookingSuccessClientProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      return;
    }

    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      } else {
        setError(data.error || 'Failed to fetch booking details');
      }
    } catch (err) {
      setError('An error occurred while fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Booking Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The booking details could not be found.'}</p>
          <button
            onClick={() => SmartNavigation.navigateWithTracking(router, '/')}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="w-4 h-4 inline mr-2" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              Booking Submitted Successfully!
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Thank you for choosing Trek Hub India. Your booking request has been received and is being reviewed by our team.
            </p>
          </motion.div>

          {/* Approval Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 sm:mb-12"
          >
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-foreground mb-2">What happens next?</h3>
                    <div className="space-y-3 text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Our team will review your booking request within <strong className="text-foreground">24 hours</strong></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>You'll receive an email confirmation once your booking is approved</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Payment instructions will be provided after approval</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>You can track your booking status in your dashboard</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Booking Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8 sm:mb-12"
          >
            <Card className="shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <Mountain className="w-6 h-6 text-primary" />
                  Booking Details
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  {/* Trek Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Trek Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <Mountain className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{booking.trek_name}</p>
                            <p className="text-sm text-muted-foreground">Trek Name</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{formatDate(booking.booking_date)}</p>
                            <p className="text-sm text-muted-foreground">Trek Date</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{booking.participants} {booking.participants === 1 ? 'Person' : 'People'}</p>
                            <p className="text-sm text-muted-foreground">Participants</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{formatCurrency(booking.total_amount)}</p>
                            <p className="text-sm text-muted-foreground">Total Amount (incl. GST)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{booking.customer_name}</p>
                            <p className="text-sm text-muted-foreground">Primary Contact</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">{booking.customer_email}</p>
                            <p className="text-sm text-muted-foreground">Email Address</p>
                          </div>
                        </div>
                        
                        {booking.customer_phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-foreground">{booking.customer_phone}</p>
                              <p className="text-sm text-muted-foreground">Phone Number</p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-foreground">#{booking.id.slice(0, 9).toUpperCase()}</p>
                            <p className="text-sm text-muted-foreground">Booking Reference</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Requirements */}
                {booking.special_requirements && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-foreground mb-3">Special Requirements</h3>
                    <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                      {booking.special_requirements}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={() => SmartNavigation.navigateWithTracking(router, '/dashboard/bookings')}
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <User className="w-5 h-5" />
              View My Bookings
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => SmartNavigation.navigateWithTracking(router, '/treks')}
              className="px-8 py-4 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <Mountain className="w-5 h-5" />
              Explore More Treks
            </button>
            
            <button
              onClick={() => SmartNavigation.navigateWithTracking(router, '/')}
              className="px-8 py-4 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </button>
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
