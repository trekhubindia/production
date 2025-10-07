'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Users, Mountain } from 'lucide-react';
import { Trek } from '@/lib/trek-data';
import WishlistButton from '@/components/WishlistButton';

interface DynamicSlot {
  id: string;
  date: string;
  capacity: number;
  booked: number;
  available: number;
  status: string;
}

interface TrekCardProps {
  trek: Trek;
}

export default function TrekCard({ trek }: TrekCardProps) {
  const [dynamicSlots, setDynamicSlots] = useState<DynamicSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch slots only
        const slotsResponse = await fetch(`/api/slots?trek_slug=${encodeURIComponent(trek.slug)}`);

        if (slotsResponse.ok) {
          const slotsData = await slotsResponse.json();
          setDynamicSlots(slotsData.allSlots || slotsData.slots || []);
        } else {
          console.warn(`Failed to fetch slots for ${trek.slug}`);
          setDynamicSlots([]);
        }
      } catch (error) {
        console.warn(`Error fetching data for ${trek.slug}:`, error);
        setDynamicSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trek.slug]);

  // Calculate total available slots for "Few Seats Left" badge and stats
  const totalAvailable = dynamicSlots.length > 0 
    ? dynamicSlots.reduce((sum, slot) => sum + slot.available, 0)
    : (typeof trek.slots === 'number' ? trek.slots : 0);

  // Check if few seats left (less than 5 available across all slots)
  const hasFewSeats = totalAvailable > 0 && totalAvailable <= 5;

  return (
    <div className="group schedule-card relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl overflow-hidden flex flex-col w-full mx-auto border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-auto min-h-[520px] sm:min-h-[580px]">
      {/* Image */}
      <div className="relative h-[200px] sm:h-[240px] overflow-hidden flex-shrink-0">
        <Image
          src={trek.image || '/images/placeholder.jpg'}
          alt={trek.name || 'Trek Image'}
          fill
          className="w-full h-full object-cover scale-[1.02] transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Left Badge(s) */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-col gap-2">
          {hasFewSeats && (
            <span className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-lg bg-red-500 text-white">
              Few Seats Left
            </span>
          )}
          {trek.featured && (
            <span className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1">
              ⭐ Featured
            </span>
          )}
          {loading && (
            <span className="px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold shadow-lg bg-gray-500 text-white animate-pulse">
              Loading...
            </span>
          )}
        </div>

        {/* Price Ribbon and Wishlist */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col items-end gap-2">
          <div className="rounded-lg sm:rounded-xl bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-xl border border-gray-200/40 dark:border-gray-600/40">
            <div className="text-xs sm:text-sm font-bold leading-tight text-green-600 dark:text-green-400">₹{trek.price?.toLocaleString()}</div>
            <div className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400">incl. 5% GST</div>
          </div>
          <WishlistButton 
            trekSlug={trek.slug} 
            trekName={trek.name}
            size="md"
            className="shadow-xl border border-gray-200/40 dark:border-gray-600/40"
          />
        </div>

        {/* Bottom strip: duration & difficulty */}
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 flex items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white border border-gray-200/40 dark:border-gray-600/40 shadow">
            {trek.duration}
          </span>
          {trek.difficulty && (
            <span className="text-[10px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white border border-gray-200/40 dark:border-gray-600/40 shadow">
              {trek.difficulty}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {trek.name}
        </h3>

        {/* Region */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600/40 rounded-full px-2.5 py-1">
            <MapPin className="w-3.5 h-3.5" /> {trek.region}
          </span>
        </div>

        {/* Stats pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/40 rounded-lg px-3 py-2.5">
            <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <span className="font-medium">
              {loading ? '...' : (
                dynamicSlots.length > 0 
                  ? (totalAvailable > 0 ? `${totalAvailable} available` : 'Fully booked')
                  : (typeof trek.slots === 'number' && trek.slots > 0 
                      ? `${trek.slots} slots` 
                      : (Array.isArray(trek.slots) && trek.slots.length > 0 
                          ? `${trek.slots.length} slots` 
                          : 'Check availability'))
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600/40 rounded-lg px-3 py-2.5">
            <Mountain className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="font-medium">{trek.sections?.overview?.altitude || 'N/A'}</span>
          </div>
        </div>



        {/* Description */}
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-5 line-clamp-3">{trek.description}</p>

        {/* CTAs */}
        <div className="flex flex-col gap-2.5 mt-auto pt-2">
          <Link
            href={`/treks/${trek.slug}`}
            className="w-full border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400 py-3 px-4 rounded-xl font-medium transition-all duration-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-gray-900 text-center min-h-[48px] flex items-center justify-center text-sm sm:text-base"
          >
            View Details
          </Link>
          <Link
            href={`/book/${trek.slug}`}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white border-2 border-green-600 py-3 px-4 rounded-xl font-semibold transition-all duration-300 hover:from-green-700 hover:to-emerald-700 hover:shadow-lg text-center shadow-sm min-h-[48px] flex items-center justify-center text-sm sm:text-base"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
