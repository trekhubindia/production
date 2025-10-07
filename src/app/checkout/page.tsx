'use client';
import Head from 'next/head';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Package, Calendar, Users, MapPin } from 'lucide-react';

interface CheckoutItem {
  trekId: string;
  trekName: string;
  trekSlug: string;
  price: number;
  participants: number;
  trekDate: string;
  pickupLocation: string;
}

interface CheckoutForm {
  couponCode: string;
  specialInstructions: string;
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutPageContent />
    </Suspense>
  );
}

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState<CheckoutForm>({
    couponCode: '',
    specialInstructions: '',
  });

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      router.push('/auth?redirect=/checkout');
      return;
    }

    // Get checkout data from URL params or localStorage
    const trekId = searchParams.get('trekId');
    const trekName = searchParams.get('trekName');
    const trekSlug = searchParams.get('trekSlug');
    const price = searchParams.get('price');
    const participants = searchParams.get('participants');
    const trekDate = searchParams.get('trekDate');
    const pickupLocation = searchParams.get('pickupLocation');

    if (trekId && trekName && price) {
      setCheckoutItems([{
        trekId,
        trekName,
        trekSlug: trekSlug || '',
        price: parseFloat(price),
        participants: parseInt(participants || '1'),
        trekDate: trekDate || '',
        pickupLocation: pickupLocation || '',
      }]);
    } else {
      // Try to get from localStorage
      const savedCheckout = localStorage.getItem('checkout_items');
      if (savedCheckout) {
        try {
          setCheckoutItems(JSON.parse(savedCheckout));
        } catch (error) {
          console.error('Error parsing checkout items:', error);
        }
      }
    }

    setLoading(false);
  }, [user, authLoading, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: checkoutItems,
          couponCode: form.couponCode,
          specialInstructions: form.specialInstructions,
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear checkout data
        localStorage.removeItem('checkout_items');
        setMessage('Checkout successful! You will receive a confirmation email shortly.');
        // Redirect to dashboard or show success page
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage(data.error || 'Checkout failed. Please try again.');
      }
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.participants), 0);
  const discount = form.couponCode ? subtotal * 0.1 : 0; // 10% discount for demo
  const total = subtotal - discount;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
            </div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No Items to Checkout</h1>
          <p className="text-muted-foreground mb-6">Your checkout cart is empty.</p>
          <button
            onClick={() => router.push('/treks')}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Browse Treks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 p-8">
      <Head>
        <title>Checkout | Trek Hub India</title>
        <meta name="description" content="Complete your booking and payment for your next Himalayan trek with Trek Hub India." />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-card rounded-lg p-6 border border-border">
              <h2 className="text-xl font-bold text-foreground mb-4">Order Summary</h2>
              
              {checkoutItems.map((item, index) => (
                <div key={index} className="border-b border-border pb-4 mb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">{item.trekName}</h3>
                    <span className="text-primary font-bold">₹{item.price?.toLocaleString()}</span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{item.participants} {item.participants === 1 ? 'person' : 'people'}</span>
                    </div>
                    {item.trekDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(item.trekDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.pickupLocation && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{item.pickupLocation}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal?.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-₹{discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border">
                  <span>Total:</span>
                  <span className="text-primary">₹{total?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-6">Payment & Details</h2>
            
            {message && (
              <div className={`p-4 rounded-lg mb-6 ${
                message.includes('successful') 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Coupon Code
                </label>
                <input
                  type="text"
                  name="couponCode"
                  value={form.couponCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                  placeholder="Enter coupon code (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <Package className="w-4 h-4 inline mr-2" />
                  Special Instructions
                </label>
                <textarea
                  name="specialInstructions"
                  value={form.specialInstructions}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors resize-none"
                  placeholder="Any special instructions or requirements..."
                />
              </div>

              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-2">Payment Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You will be redirected to our secure payment gateway to complete your booking.
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>• We accept all major credit/debit cards</p>
                  <p>• UPI payments are also accepted</p>
                  <p>• Payment is processed securely</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : `Pay ₹${total?.toLocaleString()}`}
                </button>
                
                {checkoutItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => window.location.href = `/treks/${checkoutItems[0].trekSlug}`}
                    className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel & Return to Trek Details
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 