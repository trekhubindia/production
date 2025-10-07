'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Snowflake, Sun, CloudRain, Leaf, Mountain, MapPin, Thermometer } from 'lucide-react';

const SeasonalTrekkingCalendar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '100px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const seasons = [
    {
      name: 'Winter',
      months: [11, 0, 1], // Dec, Jan, Feb
      icon: Snowflake,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      regions: ['Ladakh (Chadar Trek)', 'Himachal (Snow Treks)', 'Uttarakhand (Winter Treks)'],
      temperature: '-10°C to 15°C',
      highlights: ['Frozen waterfalls', 'Snow-covered peaks', 'Clear mountain views', 'Unique winter wildlife'],
      bestFor: 'Experienced trekkers seeking winter adventure'
    },
    {
      name: 'Spring',
      months: [2, 3, 4], // Mar, Apr, May
      icon: Leaf,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      regions: ['Uttarakhand', 'Himachal Pradesh', 'Nepal (Lower altitudes)'],
      temperature: '5°C to 25°C',
      highlights: ['Blooming rhododendrons', 'Clear weather', 'Perfect visibility', 'Comfortable temperatures'],
      bestFor: 'All skill levels - ideal for beginners'
    },
    {
      name: 'Monsoon',
      months: [5, 6, 7], // Jun, Jul, Aug
      icon: CloudRain,
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400',
      bgColor: 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20',
      regions: ['Ladakh', 'Spiti Valley', 'Upper Himachal (Rain shadow areas)'],
      temperature: '10°C to 30°C',
      highlights: ['Lush green valleys', 'Waterfalls at peak', 'Valley of Flowers', 'Unique desert landscapes'],
      bestFor: 'Rain shadow regions and high altitude deserts'
    },
    {
      name: 'Autumn',
      months: [8, 9, 10], // Sep, Oct, Nov
      icon: Sun,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      bgColor: 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
      regions: ['Nepal', 'Uttarakhand', 'Himachal Pradesh', 'Sikkim'],
      temperature: '0°C to 20°C',
      highlights: ['Crystal clear skies', 'Best mountain views', 'Stable weather', 'Perfect photography'],
      bestFor: 'Peak trekking season - all levels welcome'
    }
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentSeason = () => {
    return seasons.find(season => season.months.includes(selectedMonth)) || seasons[0];
  };

  const currentSeason = getCurrentSeason();
  const SeasonIcon = currentSeason.icon;

  return (
    <section 
      ref={sectionRef}
      className="seasonal-calendar pb-20 bg-white dark:bg-background"
    >
      <div className="max-w-7xl mx-auto px-5">
        <div className={`text-center mb-16 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <h2 className="text-4xl font-bold text-primary mb-4">
            Seasonal Trekking Calendar
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Plan your perfect Himalayan adventure with our comprehensive seasonal guide. 
            Discover the best times to trek different regions throughout the year.
          </p>
        </div>

        {/* Month Selector */}
        <div className={`mb-12 transition-all duration-300 delay-100 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(index)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  selectedMonth === index
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'bg-white/80 dark:bg-gray-800/80 text-muted-foreground hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Current Season Display */}
        <div className={`${currentSeason.bgColor} rounded-2xl p-8 mb-12 border border-border/20 shadow-lg transition-all duration-300 delay-200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${currentSeason.color} rounded-lg flex items-center justify-center mr-4`}>
                  <SeasonIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-primary">{currentSeason.name} Trekking</h3>
                  <p className="text-muted-foreground">{months[selectedMonth]} - Perfect for {currentSeason.bestFor}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Thermometer className="w-5 h-5 text-primary mr-3" />
                  <span className="font-medium">Temperature Range: {currentSeason.temperature}</span>
                </div>
                
                <div>
                  <div className="flex items-center mb-2">
                    <MapPin className="w-5 h-5 text-primary mr-3" />
                    <span className="font-medium">Best Regions:</span>
                  </div>
                  <div className="ml-8 space-y-1">
                    {currentSeason.regions.map((region, index) => (
                      <div key={index} className="text-muted-foreground">• {region}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-primary mb-4">Season Highlights</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentSeason.highlights.map((highlight, index) => (
                  <div key={index} className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 text-sm">
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* All Seasons Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {seasons.map((season, index) => {
            const IconComponent = season.icon;
            return (
              <div
                key={season.name}
                className={`season-card bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-border/20 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-2 cursor-pointer ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                } ${season.months.includes(selectedMonth) ? 'ring-2 ring-primary' : ''}`}
                style={{ 
                  transitionDelay: `${300 + index * 50}ms`,
                  willChange: 'transform, opacity'
                }}
                onClick={() => setSelectedMonth(season.months[0])}
              >
                <div className={`w-12 h-12 ${season.color} rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold text-primary mb-2">
                  {season.name}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4">
                  {season.bestFor}
                </p>
                
                <div className="text-xs text-muted-foreground">
                  {season.months.map(monthIndex => months[monthIndex]).join(', ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-16 transition-all duration-300 delay-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-border/20 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Plan Your Perfect Trek
            </h3>
            <p className="text-muted-foreground mb-6">
              Ready to explore the Himalayas? Browse our seasonal trek recommendations 
              and find the perfect adventure for your preferred time of year.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/treks"
                className="inline-flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Mountain className="w-5 h-5 mr-2" />
                Browse Seasonal Treks
              </a>
              <a
                href="/contact"
                className="inline-flex items-center bg-muted text-muted-foreground px-8 py-3 rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Get Expert Advice
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SeasonalTrekkingCalendar;
