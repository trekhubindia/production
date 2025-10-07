'use client';

import { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Mountain, Calendar, Users, AlertCircle, Loader2 } from 'lucide-react';
import { createIntersectionObserver, preloadImages } from '@/utils/performanceOptimizations';
import { usePopularTreks } from '@/hooks/usePopularTreks';

interface TrekDestination {
  id: string;
  name: string;
  region: string;
  difficulty: string;
  duration: string;
  maxAltitude: string;
  bestTime: string;
  image: string;
  description: string;
  highlights: string[];
  slug: string;
  featured?: boolean;
  rating?: number;
  price?: number;
}

const getDifficultyColor = (difficulty: string) => {
  const normalizedDifficulty = difficulty.toLowerCase();
  if (normalizedDifficulty.includes('easy')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  } else if (normalizedDifficulty.includes('moderate')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  } else if (normalizedDifficulty.includes('difficult')) {
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
  } else if (normalizedDifficulty.includes('expert') || normalizedDifficulty.includes('challenging')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

// Memoized Trek Card Component
const TrekCard = memo(function TrekCard({ 
  trek, 
  index, 
  isVisible 
}: { 
  trek: TrekDestination; 
  index: number; 
  isVisible: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Stagger the loading to prevent all images loading at once
      const timer = setTimeout(() => {
        setShouldLoad(true);
      }, index * 100);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, index]);

  return (
    <div
      className={`trek-card bg-card/5 rounded-xl overflow-hidden border border-border/20 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 fade-in-up ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ 
        transitionDelay: `${index * 100}ms`,
        willChange: 'transform, opacity'
      }}
    >
      <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
        {shouldLoad && (
          <Image
            src={trek.image}
            alt={trek.name}
            fill
            className={`object-cover transition-all duration-700 hover:scale-105 ${
              imageLoaded 
                ? 'opacity-100 brightness-105 contrast-110 saturate-105' 
                : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={85}
            style={{ willChange: 'transform' }}
          />
        )}
        
        {/* Loading skeleton */}
        {!imageLoaded && shouldLoad && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        )}
        
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${getDifficultyColor(trek.difficulty)}`}>
            {trek.difficulty}
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center mb-2">
          <MapPin className="w-4 h-4 text-primary mr-2" />
          <span className="text-sm text-muted-foreground">{trek.region}</span>
        </div>

        <h3 className="text-xl font-bold text-primary mb-3">
          {trek.name}
        </h3>

        <p className="text-foreground/80 text-sm mb-4 line-clamp-3">
          {trek.description}
        </p>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 text-primary mr-2" />
            <span className="text-muted-foreground">{trek.duration}</span>
          </div>
          <div className="flex items-center">
            <Mountain className="w-4 h-4 text-primary mr-2" />
            <span className="text-muted-foreground">{trek.maxAltitude}</span>
          </div>
        </div>

        <div className="mb-4">
          <span className="text-xs text-muted-foreground">Best Time: </span>
          <span className="text-xs font-medium text-primary">{trek.bestTime}</span>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-semibold text-primary mb-2">Highlights:</h4>
          <div className="flex flex-wrap gap-1">
            {trek.highlights.map((highlight, highlightIndex) => (
              <span
                key={highlightIndex}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <Link
          href={`/treks/${trek.slug}`}
          className="block w-full text-center bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          View Details
        </Link>
      </div>
    </div>
  );
});

const OptimizedTrekDestinationsSection = memo(function OptimizedTrekDestinationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  // Fetch popular treks from database
  const { treks: popularTreks, loading, error, refetch } = usePopularTreks(6);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            // Preload images when section becomes visible and treks are loaded
            if (!imagesPreloaded && popularTreks.length > 0) {
              const imageUrls = popularTreks.map(trek => trek.image);
              preloadImages(imageUrls).then(() => {
                setImagesPreloaded(true);
              });
            }
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, [imagesPreloaded, popularTreks]);

  return (
    <section 
      ref={sectionRef}
      className="trek-destinations py-20 bg-white dark:bg-background"
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className={`text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl font-bold text-primary mb-4">
            Popular Trek Destinations
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Explore the most breathtaking trekking routes across the Indian Himalayas, 
            from easy valley walks to challenging high-altitude expeditions
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="trek-card bg-card/5 rounded-xl overflow-hidden border border-border/20 shadow-lg">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Popular Treks
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {error}
            </p>
            <button
              onClick={refetch}
              className="inline-flex items-center bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              <Loader2 className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        )}

        {/* Success State */}
        {!loading && !error && popularTreks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularTreks.map((trek, index) => (
              <TrekCard
                key={trek.id}
                trek={trek}
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && popularTreks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mountain className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Popular Treks Found
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Check back soon for amazing trek destinations!
            </p>
          </div>
        )}

        <div className={`text-center mt-12 transition-all duration-700 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <Link
            href="/treks"
            className="inline-flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium hover-lift"
          >
            <Users className="w-5 h-5 mr-2" />
            View All Treks
          </Link>
        </div>

        {/* Additional Info */}
        {!loading && popularTreks.length > 0 && (
          <div className={`mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-700 delay-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">{popularTreks.length}+</div>
              <div className="text-muted-foreground">Popular Destinations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {new Set(popularTreks.map(trek => trek.region)).size}
              </div>
              <div className="text-muted-foreground">Regions Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">
                {new Set(popularTreks.map(trek => trek.difficulty)).size}
              </div>
              <div className="text-muted-foreground">Difficulty Levels</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
});

export default OptimizedTrekDestinationsSection;
