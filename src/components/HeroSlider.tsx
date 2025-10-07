'use client';

import { useState, useEffect } from 'react';
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

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: string;
    top: string;
    animationDelay: string;
    animationDuration: string;
  }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate particles only on client-side to avoid hydration mismatch
    const generateParticles = () => {
      const particleArray = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 4}s`
      }));
      setParticles(particleArray);
    };

    generateParticles();
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="hero-slider h-screen w-full relative overflow-hidden bg-black">
      {/* Animated Background Particles */}
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
                animationDuration: particle.animationDuration
              }}
            />
          ))}
        </div>
      </div>

      <div className="slides-container w-full h-full relative bg-black">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide w-full h-full absolute top-0 left-0 transition-all duration-1000 ${
              index === currentSlide ? 'opacity-100 z-[1] scale-100' : 'opacity-0 scale-105'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover transition-transform duration-10000 brightness-110 contrast-125 saturate-110 hover:scale-105"
              priority={index === 0}
            />
            
            {/* Enhanced Gradient Overlay - Reduced opacity for more vibrant images */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            <div className={
              `slide-content absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
              text-center text-white z-[3] w-[92%] max-w-[400px]
              md:left-0 md:transform md:-translate-y-1/2 md:translate-x-0
              md:text-left md:px-[80px] md:max-w-[800px]`
            }>
              {/* Premium Badge */}
              <div className="premium-badge inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in-up">
                <Star className="w-4 h-4 fill-current" />
                Premium Experience
              </div>

              <h2 className="title text-[3.2em] md:text-[min(7em,18vw)] leading-[0.9] m-0 mb-2 md:mb-0 whitespace-normal md:whitespace-nowrap font-black tracking-tight animate-fade-in-up animation-delay-200 bg-transparent">
                {slide.title}
              </h2>
              <h3 className="subtitle text-[2.2em] md:text-[min(4.5em,12vw)] leading-[1.1] my-2 md:my-[0.2em] whitespace-normal md:whitespace-nowrap font-bold text-green-400 animate-fade-in-up animation-delay-400 bg-transparent">
                {slide.subtitle}
              </h3>
              <p className="description text-lg md:text-[clamp(1.1rem,2.8vw,1.4rem)] max-w-[350px] md:max-w-[600px] leading-[1.6] md:leading-[1.7] my-4 md:my-6 mx-auto md:mx-0 text-gray-200 animate-fade-in-up animation-delay-600">
                {slide.description}
              </p>

              {/* Stats Row */}
              <div className="stats-row flex flex-wrap gap-4 justify-center md:justify-start mb-8 animate-fade-in-up animation-delay-800">
                {Object.entries(slide.stats).map(([key, value]) => (
                  <div key={key} className="stat-item flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                    {key === 'altitude' && <Mountain className="w-4 h-4" />}
                    {key === 'duration' && <Clock className="w-4 h-4" />}
                    {key === 'difficulty' && <Star className="w-4 h-4" />}
                    <span className="text-sm font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Highlights */}
              <div className="highlights flex flex-wrap gap-2 justify-center md:justify-start mb-8 animate-fade-in-up animation-delay-1000">
                {slide.highlights.map((highlight, idx) => (
                  <span key={idx} className="highlight-tag bg-green-500/20 border border-green-500/30 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    {highlight}
                  </span>
                ))}
              </div>

              <div className="button-group flex gap-4 justify-center md:justify-start flex-wrap mt-8 md:mt-[40px] animate-fade-in-up animation-delay-1200">
                <Link
                  href={`/treks/${slide.title.toLowerCase().replace(/\s+/g, '-')}`}
                  className="btn primary group inline-flex items-center gap-2 py-4 px-8 md:py-5 md:px-10 mx-2 rounded-xl no-underline font-semibold transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400 hover:-translate-y-[3px] hover:shadow-[0_10px_30px_rgba(34,197,94,0.4)] transform hover:scale-105"
                >
                  Explore Trek
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </section>
  );
}