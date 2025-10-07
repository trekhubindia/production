'use client';
import { useState, useEffect } from 'react';
import { Users, Mountain, Award, Globe, Star, Heart, Shield, MapPin, TrendingUp, Zap } from 'lucide-react';

interface Stat {
  id: string;
  icon: React.ReactNode;
  value: number;
  suffix: string;
  label: string;
  description: string;
  color: string;
}

const stats: Stat[] = [
  {
    id: '1',
    icon: <Users className="w-8 h-8" />,
    value: 500,
    suffix: '+',
    label: 'Happy Trekkers',
    description: 'Satisfied adventurers from around the world',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: '2',
    icon: <Mountain className="w-8 h-8" />,
    value: 15,
    suffix: '+',
    label: 'Trek Destinations',
    description: 'Across the Indian Himalayas',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: '3',
    icon: <Award className="w-8 h-8" />,
    value: 10,
    suffix: '+',
    label: 'Years Experience',
    description: 'Leading Himalayan adventures',
    color: 'from-amber-500 to-orange-500'
  },
  {
    id: '4',
    icon: <Star className="w-8 h-8" />,
    value: 4.9,
    suffix: '/5',
    label: 'Average Rating',
    description: 'From our trekkers',
    color: 'from-yellow-500 to-amber-500'
  },
  {
    id: '5',
    icon: <Heart className="w-8 h-8" />,
    value: 100,
    suffix: '%',
    label: 'Safety Record',
    description: 'Zero major incidents',
    color: 'from-red-500 to-pink-500'
  },
  {
    id: '6',
    icon: <Globe className="w-8 h-8" />,
    value: 20,
    suffix: '+',
    label: 'Countries',
    description: 'Trekkers from around the world',
    color: 'from-purple-500 to-indigo-500'
  },
  {
    id: '7',
    icon: <Shield className="w-8 h-8" />,
    value: 50,
    suffix: '+',
    label: 'Certified Guides',
    description: 'Expert mountain leaders',
    color: 'from-teal-500 to-cyan-500'
  },
  {
    id: '8',
    icon: <MapPin className="w-8 h-8" />,
    value: 1000,
    suffix: '+',
    label: 'Kilometers',
    description: 'Of trails explored',
    color: 'from-indigo-500 to-blue-500'
  }
];

export default function StatsSection() {
  const [animatedStats, setAnimatedStats] = useState<{ [key: string]: number }>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if animation has been shown before
    const hasAnimatedBefore = localStorage.getItem('stats-animation-shown');
    
    if (hasAnimatedBefore) {
      // If animation was shown before, set all stats to their final values
      const finalStats: { [key: string]: number } = {};
      stats.forEach((stat) => {
        finalStats[stat.id] = stat.value;
      });
      setAnimatedStats(finalStats);
      setIsVisible(true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedBefore) {
            setIsVisible(true);
            // Mark animation as shown
            localStorage.setItem('stats-animation-shown', 'true');
            
            // Start animation only on first visit
            stats.forEach((stat) => {
              animateCounter(stat.id, stat.value);
            });
          }
        });
      },
      { threshold: 0.3 }
    );

    const element = document.querySelector('.stats-section');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  const animateCounter = (id: string, targetValue: number) => {
    const duration = 2500;
    const steps = 80;
    const increment = targetValue / steps;
    let currentValue = 0;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      setAnimatedStats(prev => ({
        ...prev,
        [id]: Math.floor(currentValue * 10) / 10
      }));
    }, duration / steps);
  };

  return (
    <section className="stats-section py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in-up">
            <TrendingUp className="w-4 h-4" />
            Our Success Story
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-primary mb-6 gradient-text animate-fade-in-up animation-delay-200">
            Our Achievements
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Numbers that tell the story of our commitment to excellence in Himalayan trekking
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className={`stat-card group relative bg-card/5 rounded-3xl p-8 border border-border/20 shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 premium-hover card-glow text-center animate-fade-in-up`}
              style={{ 
                animationDelay: `${(index + 1) * 100}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(30px)'
              }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 rounded-3xl transition-opacity duration-300 group-hover:opacity-10`} />
              
              <div className="relative z-10">
                <div className={`text-primary mb-6 flex justify-center p-4 rounded-2xl bg-gradient-to-br ${stat.color} bg-opacity-10 group-hover:bg-opacity-20 transition-all duration-300`}>
                  {stat.icon}
                </div>
                <div className="text-4xl md:text-5xl font-black text-primary mb-4 gradient-text">
                  {animatedStats[stat.id] || 0}{stat.suffix}
                </div>
                <div className="text-xl font-bold text-foreground mb-3">
                  {stat.label}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Achievements */}
        <div className="mt-20 animate-fade-in-up animation-delay-800">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-10 border border-green-500/20 shadow-2xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
                <Zap className="w-4 h-4" />
                Recent Milestones
              </div>
              <h3 className="text-3xl font-black text-primary mb-4 gradient-text">
                Breaking New Ground
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center group">
                <div className="text-5xl font-black text-primary mb-4 group-hover:scale-110 transition-transform duration-300">2025</div>
                <div className="text-xl font-bold text-foreground mb-3">Best Adventure Company</div>
                <div className="text-muted-foreground leading-relaxed">Awarded by Adventure Tourism Association</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-black text-primary mb-4 group-hover:scale-110 transition-transform duration-300">500+</div>
                <div className="text-xl font-bold text-foreground mb-3">Successful Treks</div>
                <div className="text-muted-foreground leading-relaxed">Completed without any major incidents</div>
              </div>
              <div className="text-center group">
                <div className="text-5xl font-black text-primary mb-4 group-hover:scale-110 transition-transform duration-300">15+</div>
                <div className="text-xl font-bold text-foreground mb-3">Expert Guides</div>
                <div className="text-muted-foreground leading-relaxed">Certified by recognized institutes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 text-center animate-fade-in-up animation-delay-1000">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="text-3xl font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-300">24/7</div>
              <div className="text-muted-foreground font-medium">Support Available</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-300">100%</div>
              <div className="text-muted-foreground font-medium">Equipment Certified</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-300">Insurance</div>
              <div className="text-muted-foreground font-medium">Coverage Included</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl font-black text-primary mb-3 group-hover:scale-110 transition-transform duration-300">Eco-Friendly</div>
              <div className="text-muted-foreground font-medium">Sustainable Practices</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 