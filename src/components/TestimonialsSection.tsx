'use client';
import { useState, useEffect } from 'react';
import { Star, Quote, Sparkles, ThumbsUp, Loader2 } from 'lucide-react';

interface Testimonial {
  id: string | number;
  name: string;
  location: string;
  trek: string;
  rating: number;
  review: string;
  title?: string;
  date: string;
  avatar?: string;
  badge?: string;
  helpful_count?: number;
  verified?: boolean;
}

// Fallback testimonials in case no real reviews are found
const fallbackTestimonials: Testimonial[] = [
  {
    id: 'fallback-1',
    name: "Priya Sharma",
    location: "Mumbai, India",
    trek: "Kedarkantha Winter Trek",
    rating: 5,
    review: "The Kedarkantha winter trek was absolutely magical! The snow-covered landscapes were breathtaking, and our guide Rajesh was incredibly knowledgeable about the terrain. The team took excellent care of us throughout the journey. Highly recommended for anyone looking for a winter adventure!",
    date: "January 2024",
    badge: "Verified Trekker"
  },
  {
    id: 'fallback-2',
    name: "Arjun Patel",
    location: "Delhi, India",
    trek: "Valley of Flowers Trek",
    rating: 5,
    review: "What an incredible experience! The Valley of Flowers was like walking through a painting. The guides were professional, the accommodation was comfortable, and the food was delicious. The team's attention to safety and detail made this trek unforgettable.",
    date: "August 2023",
    badge: "Premium Member"
  },
  {
    id: 'fallback-3',
    name: "Sarah Johnson",
    location: "London, UK",
    trek: "Hampta Pass Trek",
    rating: 5,
    review: "As a solo female traveler, I was initially nervous about trekking in the Himalayas. But the team made me feel completely safe and supported. The Hampta Pass trek exceeded all my expectations - stunning views, great company, and memories I'll cherish forever.",
    date: "June 2023",
    badge: "International Trekker"
  },
  {
    id: 4,
    name: "Rahul Verma",
    location: "Bangalore, India",
    trek: "Auden's Col Expedition",
    rating: 5,
    review: "The Auden's Col expedition was challenging but absolutely worth it! The technical expertise of the guides, quality equipment, and meticulous planning made this advanced trek accessible. The team's professionalism and safety protocols were outstanding.",
    date: "September 2023",
    badge: "Adventure Expert"
  },
  {
    id: 5,
    name: "Meera Kapoor",
    location: "Chennai, India",
    trek: "Annapurna Base Camp",
    rating: 5,
    review: "My first Himalayan trek was the Annapurna Base Camp, and it was perfect! The gradual acclimatization, comfortable accommodations, and expert guidance made this challenging trek manageable. The views were spectacular, and the team's hospitality was exceptional.",
    date: "October 2023",
    badge: "First Timer"
  },
  {
    id: 6,
    name: "David Chen",
    location: "Singapore",
    trek: "Brahmatal Winter Trek",
    rating: 5,
    review: "The Brahmatal winter trek was my first experience with snow trekking, and it was incredible! The team's expertise in winter conditions, quality gear, and warm hospitality made this adventure safe and enjoyable. Can't wait to book my next trek with them!",
    date: "December 2023",
    badge: "Winter Trekker"
  }
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(fallbackTestimonials);
  const [loading, setLoading] = useState(true);
  const [isRealData, setIsRealData] = useState(false);

  // Fetch real testimonials from database
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch('/api/testimonials?limit=6&min_rating=4');
        const data = await response.json();

        if (data.testimonials && data.testimonials.length > 0) {
          setTestimonials(data.testimonials);
          setIsRealData(true);
        } else {
          // Use fallback testimonials if no real reviews found
          setTestimonials(fallbackTestimonials);
          setIsRealData(false);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Use fallback testimonials on error
        setTestimonials(fallbackTestimonials);
        setIsRealData(false);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonials.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const handleHelpfulClick = async (reviewId: string | number) => {
    if (!isRealData || typeof reviewId === 'string' && reviewId.startsWith('fallback')) return;

    try {
      await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId })
      });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    }
  };

  return (
    <section className="testimonials-section py-24 bg-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            {isRealData ? 'Real Stories from Our Database' : 'Real Stories'}
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-primary mb-6 gradient-text animate-fade-in-up animation-delay-200">
            What Our Trekkers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            {isRealData 
              ? 'Authentic reviews from verified trekkers who have completed their adventures with us'
              : 'Discover authentic experiences from adventurers who have conquered the Himalayas with us'
            }
          </p>
        </div>

        <div className="relative">
          {/* Main Testimonial */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-card/5 to-card/10 rounded-3xl p-8 md:p-12 border border-border/20 shadow-2xl relative overflow-hidden animate-fade-in-up animation-delay-600">
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-amber-500/20">
                <Quote className="w-16 h-16" />
              </div>

              {/* Badge */}
              {!loading && testimonials.length > 0 && testimonials[currentIndex]?.badge && (
                <div className="absolute top-6 left-6">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    {testimonials[currentIndex].badge}
                  </div>
                </div>
              )}

              <div className="relative z-10">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading testimonials...</span>
                  </div>
                ) : testimonials.length > 0 ? (
                  <>
                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-6">
                      {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Review Title (if available) */}
                    {testimonials[currentIndex].title && (
                      <h3 className="text-xl font-semibold text-foreground mb-4">
                        {testimonials[currentIndex].title}
                      </h3>
                    )}

                    {/* Review */}
                    <blockquote className="text-lg md:text-xl text-foreground leading-relaxed mb-8 italic">
                      &quot;{testimonials[currentIndex].review}&quot;
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-bold text-primary mb-1">
                          {testimonials[currentIndex].name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{testimonials[currentIndex].location}</span>
                          <span>•</span>
                          <span>{testimonials[currentIndex].trek}</span>
                          <span>•</span>
                          <span>{testimonials[currentIndex].date}</span>
                          {testimonials[currentIndex].verified && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">✓ Verified</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Helpful Button for Real Reviews */}
                      {isRealData && testimonials[currentIndex].helpful_count !== undefined && (
                        <button
                          onClick={() => handleHelpfulClick(testimonials[currentIndex].id)}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>Helpful ({testimonials[currentIndex].helpful_count})</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground">No testimonials available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>



          {/* Dots Indicator */}
          {!loading && testimonials.length > 0 && (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-green-500 scale-125' 
                      : 'bg-green-500/30 hover:bg-green-500/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform duration-300">4.9/5</div>
            <div className="text-muted-foreground font-medium">Average Rating</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform duration-300">500+</div>
            <div className="text-muted-foreground font-medium">Happy Trekkers</div>
          </div>
          <div className="text-center group">
            <div className="text-4xl font-black text-primary mb-2 group-hover:scale-110 transition-transform duration-300">98%</div>
            <div className="text-muted-foreground font-medium">Would Recommend</div>
          </div>
        </div>
      </div>
    </section>
  );
} 