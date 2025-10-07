'use client';

import { useState, useEffect, useRef, memo } from 'react';
import Image from 'next/image';
import { Award } from 'lucide-react';
import { useOptimizedHomepageData } from '@/hooks/useOptimizedHomepageData';
import { createIntersectionObserver } from '@/utils/performanceOptimizations';

interface TrekLeader {
  id: string;
  name: string;
  bio: string;
  experience_years: number;
  photo: string;
  created_at: string;
}

// Memoized Leader Card Component
const LeaderCard = memo(function LeaderCard({ 
  leader, 
  index, 
  isVisible 
}: { 
  leader: TrekLeader; 
  index: number; 
  isVisible: boolean;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className={`leader-card bg-card/5 rounded-2xl overflow-hidden border border-border/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 fade-in-up ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ 
        transitionDelay: `${index * 150}ms`,
        willChange: 'transform, opacity'
      }}
    >
      <div className="relative h-64 overflow-hidden bg-gray-200 dark:bg-gray-700">
        <Image
          src={leader.photo || '/images/placeholder.svg'}
          alt={leader.name}
          fill
          className={`object-cover transition-all duration-300 hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          quality={85}
          style={{ willChange: 'transform' }}
        />
        
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        )}
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-primary">{leader.name}</h3>
        </div>

        <p className="text-foreground/80 text-sm mb-4 leading-relaxed">
          {leader.bio}
        </p>

        <div className="mb-4">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Award className="w-4 h-4 mr-2" />
            <span className="font-medium">
              {leader.experience_years} {leader.experience_years === 1 ? 'year' : 'years'} of experience
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

const TrekLeadersSection = memo(function TrekLeadersSection() {
  const { data, loading, error, isInitialLoad } = useOptimizedHomepageData();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = createIntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '100px' }
    );

    observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  // Temporarily show loading state with visible text
  if (loading && isInitialLoad) {
    return (
      <section className="trek-leaders pt-20 pb-8 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4">Meet Our Expert Guides</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Loading our certified trek leaders...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="trek-leaders pt-20 pb-8 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-5">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Meet Our Expert Guides
            </h2>
            <p className="text-red-500">Failed to load trek leaders. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  const trekLeaders = data.trekLeaders;

  return (
    <section 
      ref={sectionRef}
      className="trek-leaders pt-20 pb-8 bg-white dark:bg-background"
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-16 opacity-100 translate-y-0">
          <h2 className="text-4xl font-bold text-primary mb-4">
            Meet Our Expert Guides
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our certified and experienced trek leaders ensure your safety and provide unforgettable mountain experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trekLeaders.map((leader: TrekLeader, index: number) => (
            <LeaderCard
              key={leader.id}
              leader={leader}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
                          </div>
            <div className="text-center">
                          </div>
            <div className="text-center">
                          </div>
            <div className="text-center">
                          </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default TrekLeadersSection; 