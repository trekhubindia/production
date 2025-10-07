'use client';

import { useState } from 'react';
import { Calendar, Users, MapPin, Clock, Shield, ArrowRight, Heart, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import WishlistButton from '@/components/WishlistButton';

interface ModernBookingCardProps {
  price?: number;
  slots?: number;
  slug: string;
  trekName: string;
  duration?: string | number;
  difficulty?: string;
  region?: string;
}

export default function ModernBookingCard({ 
  price, 
  slots, 
  slug, 
  trekName,
  duration,
  difficulty,
  region 
}: ModernBookingCardProps) {
  const router = useRouter();

  const handleBookNow = () => {
    router.push(`/book/${slug}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: trekName,
        text: `Check out this amazing trek: ${trekName}`,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const gstAmount = price ? Math.round(price * 0.05) : 0;
  const totalAmount = price ? price + gstAmount : 0;

  return (
    <div className="sticky top-24 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Book This Trek</h3>
          <div className="flex items-center gap-3">
            <WishlistButton 
              trekSlug={slug}
              trekName={trekName}
              size="sm"
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 border-0"
            />
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              aria-label="Share trek"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Price Display */}
        {price && (
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatPrice(price)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              per person • +5% GST ({formatPrice(gstAmount)})
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Total: {formatPrice(totalAmount)}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Trek Info */}
        <div className="grid grid-cols-2 gap-4">
          {duration && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 text-green-500" />
              <span>{duration.toString().toLowerCase().includes('day') ? duration : `${duration} Days`}</span>
            </div>
          )}
          {difficulty && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Shield className={`w-4 h-4 ${
                difficulty.toLowerCase() === 'easy' ? 'text-green-500' :
                difficulty.toLowerCase() === 'moderate' ? 'text-yellow-500' :
                'text-red-500'
              }`} />
              <span>{difficulty}</span>
            </div>
          )}
          {region && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 col-span-2">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span>{region}</span>
            </div>
          )}
        </div>

        {/* Availability */}
        {slots !== undefined && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Availability
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {slots} slots
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {slots <= 5 ? 'Few seats left!' : 'Available'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Expert local guides</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Safety equipment included</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>24/7 emergency support</span>
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={handleBookNow}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <span>Book Now</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Contact Info */}
        <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Need help?
          </div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            <button onClick={() => router.push('/contact')}>
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
