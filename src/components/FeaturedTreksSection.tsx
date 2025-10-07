'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, Star, Info, Calendar, Sparkles, Mountain } from 'lucide-react';
import AuthRequiredButton from './AuthRequiredButton';

interface Trek {
  id: string;
  name?: string;
  image?: string;
  region?: string;
  difficulty?: string;
  duration?: string;
  price?: number;
  rating?: number;
  status?: boolean;
  featured?: boolean;
  created_at?: string;
  slots?: Record<string, unknown>[] | number;
  description?: string;
  slug?: string;
  best_time?: string;
  sections?: {
    overview?: {
      altitude?: string;
      grade?: string;
    };
  };
}

export default function FeaturedTreksSection() {
  const [featuredTreks, setFeaturedTreks] = useState<Trek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedTreks = async () => {
      try {
        const response = await fetch('/api/homepage/treks?featured=true');
        if (response.ok) {
          const data = await response.json();
          setFeaturedTreks(data.treks || []);
        }
      } catch (error) {
        console.error('Error fetching featured treks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedTreks();
  }, []);

  const TrekCard = ({ trek }: { trek: Trek }) => {
    // Handle slots - could be array or number
    const slotsCount = Array.isArray(trek.slots) ? trek.slots.length : (typeof trek.slots === 'number' ? trek.slots : 0);
    const hasFewSeats = Array.isArray(trek.slots) ? trek.slots.some((slot: Record<string, unknown>) => (slot.capacity as number) - (slot.booked as number) <= 5) : false;

    return (
      <div className="featured-trek-card bg-white dark:bg-gray-800/90 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col max-w-[400px] w-full mx-auto border border-gray-200/60 dark:border-gray-600/40 shadow-lg dark:shadow-[0_4px_32px_rgba(0,0,0,0.8)] relative group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
        <div className="relative h-[180px] sm:h-[220px] overflow-hidden">
          <Image
            src={trek.image || '/images/placeholder.jpg'}
            alt={trek.name || 'Trek Image'}
            fill
            className="w-full h-full object-cover brightness-105 contrast-110 saturate-105 group-hover:brightness-110 group-hover:contrast-115 group-hover:saturate-110 group-hover:scale-110 transition-all duration-500"
          />
          
          {/* Featured Badge */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            Featured
          </div>
          
          {hasFewSeats && (
            <span className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg bg-red-500 text-white">
              Few Seats Left
            </span>
          )}
        </div>
        
        <div className="p-4 sm:p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">{trek.name}</h3>
            <div className="text-right">
              <span className="text-green-600 dark:text-green-400 font-bold text-base sm:text-lg">₹{trek.price?.toLocaleString()}</span>
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">incl. 5% GST</div>
            </div>
          </div>
          
          <div className="flex items-center text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 gap-2 sm:gap-3">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {trek.region}
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2 sm:ml-4" /> {trek.difficulty} | {trek.duration}
          </div>
          
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 gap-2 sm:gap-3">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {slotsCount} slots
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2 sm:ml-4" /> {trek.rating} rating
          </div>
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 gap-2 sm:gap-3">
            <Mountain className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {trek.sections?.overview?.altitude || 'N/A'}
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-2 sm:ml-4" /> {trek.sections?.overview?.grade || trek.difficulty}
          </div>
          
          {trek.best_time && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2 gap-2">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Best Time: {trek.best_time}</span>
            </div>
          )}
          
          <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">{trek.description}</p>
          
          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <AuthRequiredButton 
              href={`/book/${trek.slug}`}
              className="custom-button flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white border-2 border-green-500 py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:from-green-400 hover:to-emerald-400 hover:shadow-lg text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
              promptTitle="Ready for your adventure?"
              promptMessage="Join thousands of trekkers who have experienced the magic of the Himalayas. Sign in to book your spot and start your journey!"
              promptActionText="Sign In & Book"
            >
              Book Now
            </AuthRequiredButton>
            <Link 
              href={`/treks/${trek.slug}`} 
              className="flex-1 border-2 border-green-500 text-green-600 dark:text-green-400 py-3 px-4 rounded-lg font-medium transition-all duration-300 hover:bg-green-500 hover:text-white text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <section className="featured-treks py-20 bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Featured Treks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our handpicked premium treks that offer the best Himalayan experience.
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

  if (featuredTreks.length === 0) {
    return (
      <section className="featured-treks py-20 bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              Featured Treks
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              No featured treks available at the moment.
            </p>
            <Link 
              href="/treks" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-300"
            >
              View All Treks
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-treks py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-5">
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            Premium Selection
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
            Featured Treks
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Our handpicked premium treks that offer the best Himalayan experience. Each trek is carefully selected for its unique features and exceptional adventure opportunities.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10 mb-6 sm:mb-8">
          {featuredTreks.map((trek: Trek) => (
            <TrekCard key={trek.id} trek={trek} />
          ))}
        </div>
        
        <div className="text-center">
          <Link 
            href="/treks" 
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl font-medium hover:from-green-400 hover:to-emerald-400 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            Explore All Treks
          </Link>
        </div>
      </div>
    </section>
  );
} 