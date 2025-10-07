"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle, Search, TrendingUp, Clock } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  id?: string;
  is_featured?: boolean;
  view_count?: number;
  priority_score?: number;
}

interface FAQSectionProps {
  faqs: FAQ[];
  title?: string;
  subtitle?: string;
  className?: string;
  maxItems?: number;
}

export default function FAQSection({ 
  faqs, 
  title = "Frequently Asked Questions", 
  subtitle = "Everything you need to know",
  className = "",
  maxItems
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const displayFaqs = maxItems ? faqs.slice(0, maxItems) : faqs;
  
  // Filter FAQs based on search term
  const filteredFaqs = displayFaqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleFAQ = async (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
    
    // Track FAQ view when opened
    if (openIndex !== index && filteredFaqs[index]?.id) {
      try {
        await fetch('/api/faqs/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            faqId: filteredFaqs[index].id,
            action: 'view'
          })
        });
      } catch (error) {
        console.error('Failed to track FAQ view:', error);
      }
    }
  };

  // Intersection Observer for animations
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

  if (!faqs || faqs.length === 0) return null;

  return (
    <section 
      ref={sectionRef}
      className={`py-20 bg-white dark:bg-background ${className}`}
    >
      <div className="max-w-4xl mx-auto px-5">
        {/* Header */}
        <div className={`text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <HelpCircle className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-4xl font-bold text-primary">{title}</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {subtitle}
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
            />
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No FAQs found</h3>
              <p className="text-muted-foreground">Try searching with different keywords</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ 
                  transitionDelay: `${index * 100}ms`,
                  willChange: 'transform, opacity'
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-muted/50 transition-colors duration-200 group"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                      {faq.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Featured
                        </span>
                      )}
                      {faq.view_count && faq.view_count > 50 && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-medium">
                          <MessageCircle className="w-3 h-3" />
                          Popular
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {faq.question}
                    </h3>
                  </div>
                  <span className={`flex-shrink-0 text-primary transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <div className="px-6 pb-5 pt-2">
                    <div className="border-t border-border pt-4">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Call to Action */}
        <div className={`text-center mt-16 transition-all duration-700 delay-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
            <h3 className="text-2xl font-bold text-primary mb-4">
              Still have questions?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our expert team is here to help you plan your perfect Himalayan adventure. 
              Get personalized advice and answers to all your trekking questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="inline-flex items-center bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Contact Our Experts
              </a>
              <a
                href="/treks"
                className="inline-flex items-center bg-muted text-muted-foreground px-8 py-3 rounded-lg hover:bg-muted/80 transition-colors font-medium"
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                Browse All Treks
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}