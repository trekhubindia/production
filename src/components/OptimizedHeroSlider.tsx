'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Mountain, Clock } from 'lucide-react';

const slides = [
  {
    id: 1,
    image: '/images/kedarkantha-winter.jpg',
    title: 'KEDARKANTHA',
    subtitle: 'WINTER TREK',
    description: 'Experience the divine winter journey through ancient trails and snow-capped peaks. Trek through pristine landscapes at 12,500 ft.',
    stats: { altitude: '12,500 ft', duration: '6 Days', difficulty: 'Moderate' },
    highlights: ['Snow Trekking', 'Summit Views', 'Camping']
  },
  {
    id: 2,
    image: '/images/valley-flowers-summer.jpg',
    title: 'VALLEY OF FLOWERS',
    subtitle: 'SUMMER TREK',
    description: 'Discover the vibrant valley filled with exotic Himalayan flowers. A UNESCO World Heritage site at 11,500 ft.',
    stats: { altitude: '11,500 ft', duration: '7 Days', difficulty: 'Easy' },
    highlights: ['Flower Valley', 'UNESCO Site', 'Photography']
  },
  {
    id: 3,
    image: '/images/hamta.jpg',
    title: 'HAMPTA PASS',
    subtitle: 'ADVENTURE TREK',
    description: 'Cross the dramatic Hampta Pass connecting Kullu Valley to Lahaul. Experience diverse landscapes at 14,100 ft.',
    stats: { altitude: '14,100 ft', duration: '8 Days', difficulty: 'Challenging' },
    highlights: ['Pass Crossing', 'Alpine Lakes', 'Adventure']
  },
  {
    id: 4,
    image: '/images/brahmatal-spring.jpg',
    title: 'BRAHMATAL',
    subtitle: 'SPRING TREK',
    description: 'Trek to the mystical alpine lake with panoramic views of Mt. Trishul and Nanda Ghunti at 12,100 ft.',
    stats: { altitude: '12,100 ft', duration: '6 Days', difficulty: 'Moderate' },
    highlights: ['Alpine Lake', 'Mountain Views', 'Spring Blooms']
  },
  {
    id: 5,
    image: '/images/Tapovan-trek.jpg',
    title: 'TAPOVAN',
    subtitle: 'BASE CAMP TREK',
    description: 'Journey to the spiritual base camp of Mt. Shivling. Experience high-altitude meadows at 14,640 ft.',
    stats: { altitude: '14,640 ft', duration: '10 Days', difficulty: 'Expert' },
    highlights: ['Base Camp', 'Spiritual', 'High Altitude']
  },
];

export default function OptimizedHeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Memoize particles to prevent recalculation
  const particles = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 3}s`,
      animationDuration: `${3 + Math.random() * 4}s`
    }));
  }, []);

  // Optimized slide transition
  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentSlide(index);
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 600);
  }, [currentSlide, isTransitioning]);

  // Auto-advance slides with pause on hover
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      if (!isTransitioning) {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isTransitioning, mounted]);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <section className="hero-slider h-screen w-full relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="animate-pulse text-white text-center">
            <div className="w-32 h-8 bg-white/20 rounded mb-4 mx-auto"></div>
            <div className="w-48 h-6 bg-white/10 rounded mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <section className="hero-slider h-screen w-full relative overflow-hidden bg-black">
      {/* Optimized Background Particles */}
      <div className="absolute inset-0 z-0">
        <div className="particles-container">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="particle absolute w-1 h-1 bg-white/20 rounded-full animate-float"
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.animationDelay,
                animationDuration: particle.animationDuration,
                willChange: 'transform',
              }}
            />
          ))}
        </div>
      </div>

      {/* Optimized Image Slides */}
      <div className="absolute inset-0 z-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ willChange: 'opacity' }}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              quality={85}
              sizes="100vw"
              style={{ willChange: 'transform' }}
            />
          </div>
        ))}
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 w-full">
          <div className="max-w-3xl">
            {/* Optimized Text Content */}
            <div 
              className="transform transition-all duration-700 ease-out"
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-primary/20 backdrop-blur-sm text-primary text-sm font-semibold rounded-full border border-primary/30">
                  {currentSlideData.subtitle}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 leading-tight tracking-tight">
                {currentSlideData.title}
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-2xl">
                {currentSlideData.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
                <div className="flex items-center text-white/80 text-sm sm:text-base">
                  <Mountain className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" />
                  <span className="font-medium">{currentSlideData.stats.altitude}</span>
                </div>
                <div className="flex items-center text-white/80 text-sm sm:text-base">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" />
                  <span className="font-medium">{currentSlideData.stats.duration}</span>
                </div>
                <div className="flex items-center text-white/80 text-sm sm:text-base">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-primary" />
                  <span className="font-medium">{currentSlideData.stats.difficulty}</span>
                </div>
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                {currentSlideData.highlights.map((highlight, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 sm:px-3 bg-white/10 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full border border-white/20"
                  >
                    {highlight}
                  </span>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/treks"
                  className="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 hover:shadow-xl text-sm sm:text-base min-h-[48px]"
                >
                  Explore Treks
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg border border-white/30 hover:bg-white/20 transition-all duration-300 text-sm sm:text-base min-h-[48px]"
                >
                  Get Expert Advice
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <div className="flex space-x-0.5 sm:space-x-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isTransitioning}
              className={`w-px h-px sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-primary scale-25'
                  : 'bg-white/30 hover:bg-white/50 scale-25'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Hidden on mobile for better UX */}
      <button
        onClick={() => goToSlide(currentSlide === 0 ? slides.length - 1 : currentSlide - 1)}
        disabled={isTransitioning}
        className="hidden sm:block absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
        aria-label="Previous slide"
      >
        ←
      </button>
      
      <button
        onClick={() => goToSlide((currentSlide + 1) % slides.length)}
        disabled={isTransitioning}
        className="hidden sm:block absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-white/20 transition-all duration-300 disabled:opacity-50"
        aria-label="Next slide"
      >
        →
      </button>
    </section>
  );
}
