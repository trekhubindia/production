import React from 'react';
import AuthRequiredButton from './AuthRequiredButton';

interface BookingCardProps {
  price?: number;
  slots?: number;
  slug: string;
}

const BookingCard: React.FC<BookingCardProps> = ({ price, slots, slug }) => {
  return (
    <aside className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Book This Trek</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">Secure your slot</p>
      </div>

      {/* Price Section */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Starting from</div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">₹{price ? price.toLocaleString() : '--'}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">per person (incl. 5% GST)</div>
      </div>

      {/* Slots Info */}
      {typeof slots === 'number' && slots > 0 && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Available Slots</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{slots}</span>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span>Expert mountain guides</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span>Safety equipment included</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span>Accommodation & meals</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
          <span>Transportation included</span>
        </div>
      </div>

      {/* CTA Button */}
      <AuthRequiredButton 
        href={`/book/${slug}`}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg font-medium text-center hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        promptTitle="Sign in to book your adventure"
        promptMessage="Ready to start your trekking adventure? Sign in to secure your spot and get access to exclusive deals and updates."
        promptActionText="Sign In & Book"
      >
        Book Now
      </AuthRequiredButton>

      {/* Trust Indicators */}
      <div className="text-center pt-2 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Secure Payment</span>
          <span>•</span>
          <span>4.9/5 Rating</span>
        </div>
      </div>
    </aside>
  );
};

export default BookingCard; 