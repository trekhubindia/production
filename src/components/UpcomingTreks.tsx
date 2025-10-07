'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, Star, Info, Calendar, Mountain, AlertCircle, Loader2 } from 'lucide-react';
import { useUpcomingTreks } from '@/hooks/useUpcomingTreks';
import AuthRequiredButton from './AuthRequiredButton';
import WishlistButton from './WishlistButton';

interface TrekSlot {
  id: string;
  trek_id: string;
  date: string;
  capacity: number;
  booked: number;
  price: number;
}

interface Trek {
  id: string;
  name: string;
  slug: string;
  description: string;
  region: string;
  difficulty: string;
  duration: string;
  price: number;
  rating: number;
  image: string;
  status: boolean;
  featured: boolean;
  created_at: string;
  best_time: string;
  sections: {
    overview: {
      altitude: string;
      grade: string;
      best_time: string;
    };
  };
  slots: TrekSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  hasFewSeats: boolean;
}

// const badgeColors: Record<string, string> = {
//   'Popular': 'bg-yellow-400 text-yellow-900',
//   'Few Seats Left': 'bg-red-500 text-white',
//   'New': 'bg-green-500 text-white',
//   'Upcoming': 'bg-blue-500 text-white',
// };

// Function to get upcoming months (next 3 months)
const getUpcomingMonths = () => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 3; i++) {
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = futureDate.toLocaleString('default', { month: 'long' });
    months.push(monthName);
  }
  
  return months;
};

// Function to check if trek is upcoming based on best time
const isUpcomingTrek = (trek: Trek) => {
  if (!trek.best_time) return false;
  
  const upcomingMonths = getUpcomingMonths();
  const trekBestTime = trek.best_time.toLowerCase();
  
  return upcomingMonths.some(month => 
    trekBestTime.includes(month.toLowerCase())
  );
};

export default function UpcomingTreks() {
  const { treks, loading, error, upcomingCount, refetch } = useUpcomingTreks(3);

  const TrekCard = ({ trek }: { trek: Trek }) => {
    // Use the calculated values from the API
    const slotsCount = trek.availableSlots;
    const hasFewSeats = trek.hasFewSeats;

    return (
      <div className="group schedule-card relative bg-card/40 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-w-[420px] w-full mx-auto border border-border/30 shadow-lg dark:shadow-[0_8px_40px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
        {/* Image */}
        <div className="relative h-[200px] sm:h-[240px] overflow-hidden">
          <Image
            src={trek.image}
            alt={trek.name}
            fill
            className="w-full h-full object-cover scale-[1.02] transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Left Badge(s) */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-1.5 sm:gap-2">
            {hasFewSeats && (
              <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-lg bg-red-500 text-white">
                Few Seats Left
              </span>
            )}
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-lg bg-blue-600 text-white">
              Upcoming
            </span>
          </div>

          {/* Price Ribbon and Wishlist */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col items-end gap-2">
            <div className="rounded-lg sm:rounded-xl bg-white/90 dark:bg-gray-900/90 text-foreground px-2 py-1.5 sm:px-3 sm:py-2 shadow-xl border border-border/40">
              <div className="text-xs sm:text-sm font-bold leading-tight">₹{trek.price.toLocaleString()}</div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground">incl. 5% GST</div>
            </div>
            <WishlistButton 
              trekSlug={trek.slug} 
              trekName={trek.name}
              size="md"
              className="shadow-xl border border-border/40"
            />
          </div>

          {/* Bottom strip: duration & difficulty */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 dark:bg-gray-900/90 text-foreground/90 border border-border/40 shadow">
              {trek.duration}
            </span>
            {trek.difficulty && (
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/90 dark:bg-gray-900/90 text-foreground/90 border border-border/40 shadow">
                {trek.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
            {trek.name}
          </h3>

          {/* Region */}
          <div className="mb-2 sm:mb-3">
            <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs text-muted-foreground bg-muted/40 border border-border/40 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1">
              <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {trek.region}
            </span>
          </div>

          {/* Stats pills */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-card/40 border border-border/40 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2">
              <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className={slotsCount > 0 ? (hasFewSeats ? 'text-red-500 font-medium' : 'text-green-600') : 'text-gray-500'}>
                {slotsCount > 0 ? `${slotsCount} available` : 'Fully booked'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-card/40 border border-border/40 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2">
              <Mountain className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{trek.sections.overview.altitude}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-card/40 border border-border/40 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2">
              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{trek.sections.overview.grade}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground bg-card/40 border border-border/40 rounded-lg sm:rounded-xl px-2 py-1.5 sm:px-2.5 sm:py-2">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Best: {trek.best_time}</span>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${i < Math.floor(trek.rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground/40'}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{trek.rating > 0 ? trek.rating.toFixed(1) : 'No ratings yet'}</span>
          </div>

          {/* Description */}
          <p className="text-foreground/80 text-sm mb-4 sm:mb-5 line-clamp-2 sm:line-clamp-3">{trek.description}</p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <Link
              href={`/treks/${trek.slug}`}
              className="flex-1 border-2 border-primary text-primary py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:bg-primary hover:text-primary-foreground text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
            >
              View Details
            </Link>
            <AuthRequiredButton
              href={`/book/${trek.slug}`}
              className="custom-button flex-1 bg-primary text-primary-foreground border-2 border-primary py-3 px-4 rounded-lg font-semibold transition-all duration-300 hover:bg-primary/90 text-center shadow-sm min-h-[48px] flex items-center justify-center text-sm sm:text-base"
              promptTitle="Don't miss this adventure!"
              promptMessage="This trek is coming up soon and spots are filling fast. Sign in to secure your place and join the adventure!"
              promptActionText="Sign In & Reserve"
            >
              Book Now
            </AuthRequiredButton>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="upcoming-treks py-20 bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-primary font-bold mb-4 text-4xl">Upcoming Treks</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover our upcoming Himalayan adventures for the next 3 months. Perfect timing for planning your next expedition.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 h-64 rounded-2xl mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="upcoming-treks py-20 bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-primary font-bold mb-4 text-4xl">Upcoming Treks</h2>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-500 mb-4">Failed to load upcoming treks. Please try again later.</p>
            <button
              onClick={refetch}
              className="inline-flex items-center bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  const upcomingMonths = getUpcomingMonths();

  return (
    <section className="upcoming-treks py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <h2 className="text-primary font-bold mb-3 sm:mb-4 text-2xl sm:text-3xl lg:text-4xl">Upcoming Treks</h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Discover our upcoming Himalayan adventures for {upcomingMonths.join(', ')}. Perfect timing for planning your next expedition.
          </p>
        </div>
        
        {/* Treks Grid */}
        {treks.length > 0 ? (
          <div className="trek-schedule grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-6 sm:mb-8">
            {treks.map((trek: Trek) => (
              <TrekCard key={trek.id} trek={trek} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Upcoming Treks Found
            </h3>
            <div className="text-muted-foreground text-lg mb-4">
              No upcoming treks found for the next 3 months.
            </div>
            <Link 
              href="/treks" 
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              <Mountain className="w-4 h-4" />
              View All Treks
            </Link>
          </div>
        )}
        
        {/* Statistics */}
      </div>
    </section>
  );
}