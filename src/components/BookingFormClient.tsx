"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/context/AuthContext';

interface BookingFormProps {
  trekSlug: string; // Change from trekId to trekSlug
  trekName: string;
  trekPrice: number;
}

interface Slot {
  id: string;
  date?: string;
  status?: string;
  capacity?: number;
  booked?: number;
}

export default function BookingFormClient({ trekSlug, trekName, trekPrice }: BookingFormProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    participants: 1,
    specialRequirements: '',
    trekDate: '',
    pickupLocation: '',
    voucher: '',
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [dynamicPrice, setDynamicPrice] = useState<number>(trekPrice);

  // Fetch slots
  useEffect(() => {
    if (!trekSlug) return;
    setSlotsLoading(true);
    fetch(`/api/slots?trek_slug=${trekSlug}`) // Update to use trek_slug
      .then(res => res.json())
      .then(data => setSlots((data.slots || []).filter((s: Slot) => s.status === 'open' && s.capacity && s.booked !== undefined && s.capacity > s.booked)))
      .finally(() => setSlotsLoading(false));
  }, [trekSlug]);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || user.username || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  // Dynamic pricing (simulate API call)
  useEffect(() => {
    if (!form.trekDate || !form.participants) {
      setDynamicPrice(trekPrice);
      return;
    }
    // Example: fetch dynamic price from API
    fetch(`/api/bookings/trek-price?trek_slug=${trekSlug}&date=${form.trekDate}&participants=${form.participants}`) // Update to use trek_slug
      .then(res => res.json())
      .then(data => {
        if (data.price) setDynamicPrice(data.price);
        else setDynamicPrice(trekPrice);
      })
      .catch(() => setDynamicPrice(trekPrice));
  }, [form.trekDate, form.participants, trekSlug, trekPrice]);

  // Voucher validation (simulate API call)
  useEffect(() => {
    if (!form.voucher) return;
    fetch(`/api/vouchers?code=${form.voucher}`)
      .then(res => res.json())
      .then(data => {
        if (data.valid && data.discount) {
          setDynamicPrice(prev => Math.max(0, prev - data.discount));
        }
      });
  }, [form.voucher]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'participants' ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trekId: trekSlug, // Use trekSlug instead of trekId
          trekDate: form.trekDate,
          participants: form.participants,
          totalAmount: dynamicPrice * form.participants,
          customerName: form.name,
          customerPhone: form.phone,
          specialRequirements: form.specialRequirements,
          pickupLocation: form.pickupLocation,
          userId: user?.id,
          email: form.email,
          voucher: form.voucher,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        // Redirect to success page instead of payment page
        const bookingId = data.bookingId || data.booking?.id || data.id;
        if (bookingId) {
          setMessage('Booking request submitted successfully! Redirecting to confirmation page...');
          
          // Redirect to success page
          setTimeout(() => {
            window.location.href = `/booking-success/${bookingId}`;
          }, 1500);
        } else {
          setMessage('Booking request submitted successfully! Our team will review and approve your booking within 24 hours.');
        }
      } else {
        setMessage(data.error || 'Failed to submit booking request. Please try again.');
      }
    } catch {
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-[#232946] rounded-2xl shadow-xl p-8 border border-border mt-8">
      <h2 className="text-xl font-bold text-foreground mb-6">Book {trekName}</h2>
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('successfully')
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors placeholder-transparent"
            placeholder="Full Name"
            id="booking-name"
          />
          <label htmlFor="booking-name" className="absolute left-4 top-3 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs bg-background px-1 pointer-events-none">Full Name *</label>
        </div>
        <div className="relative">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors placeholder-transparent"
            placeholder="Email Address"
            id="booking-email"
          />
          <label htmlFor="booking-email" className="absolute left-4 top-3 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs bg-background px-1 pointer-events-none">Email Address *</label>
        </div>
        <div className="relative">
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            required
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors placeholder-transparent"
            placeholder="Phone Number"
            id="booking-phone"
          />
          <label htmlFor="booking-phone" className="absolute left-4 top-3 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs bg-background px-1 pointer-events-none">Phone Number *</label>
        </div>
        <div className="relative">
          <select
            name="participants"
            value={form.participants}
            onChange={handleChange}
            required
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
            id="booking-participants"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
            ))}
          </select>
          <label htmlFor="booking-participants" className="absolute left-4 -top-4 text-xs text-muted-foreground bg-background px-1 pointer-events-none">Number of Participants *</label>
        </div>
        <div className="relative">
          {slotsLoading ? (
            <div className="text-muted-foreground px-2 py-3">Loading available slots...</div>
          ) : slots.length === 0 ? (
            <div className="text-red-500 px-2 py-3">No available slots for this trek.</div>
          ) : (
            <>
              <select
                name="trekDate"
                value={form.trekDate}
                onChange={handleChange}
                required
                className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                id="booking-date"
              >
                <option value="" disabled>Select a date</option>
                {slots.map(slot => (
                  <option key={slot.id} value={slot.date}>
                    {slot.date} (Available: {(slot.capacity ?? 0) - (slot.booked ?? 0)})
                  </option>
                ))}
              </select>
              <label htmlFor="booking-date" className="absolute left-4 -top-4 text-xs text-muted-foreground bg-background px-1 pointer-events-none">Select Slot *</label>
            </>
          )}
        </div>
        <div className="relative">
          <input
            type="text"
            name="voucher"
            value={form.voucher}
            onChange={handleChange}
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors placeholder-transparent"
            placeholder="Voucher Code (optional)"
            id="booking-voucher"
          />
          <label htmlFor="booking-voucher" className="absolute left-4 top-3 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs bg-background px-1 pointer-events-none">Voucher Code</label>
        </div>
        <div className="relative">
          <textarea
            name="specialRequirements"
            value={form.specialRequirements}
            onChange={handleChange}
            rows={4}
            className="peer w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors resize-none placeholder-transparent"
            placeholder="Special Requirements"
            id="booking-special"
          />
          <label htmlFor="booking-special" className="absolute left-4 top-3 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:-top-4 peer-focus:text-xs bg-background px-1 pointer-events-none">Special Requirements</label>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg">Total: ₹{dynamicPrice * form.participants}</span>
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span>Processing...</span>
              </div>
            ) : (
              'Submit Booking Request'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => window.location.href = `/treks/${trekSlug}`}
            className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            Cancel & Return to Trek Details
          </button>
        </div>
      </form>
    </div>
  );
} 