import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Critical components loaded immediately
import OptimizedHeroSlider from '@/components/OptimizedHeroSlider';
import UpcomingTreks from '@/components/UpcomingTreks';
import WhyChooseUs from '@/components/WhyChooseUs';
import Footer from '@/components/Footer';

// Lazy load non-critical components for better performance
const Expertise = dynamic(() => import('@/components/Expertise'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const FeaturedTreksSection = dynamic(() => import('@/components/FeaturedTreksSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const TrekLeadersSection = dynamic(() => import('@/components/TrekLeadersSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const SeasonalTrekkingCalendar = dynamic(() => import('@/components/AdventureHighlightsSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const OptimizedTrekDestinationsSection = dynamic(() => import('@/components/OptimizedTrekDestinationsSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const TestimonialsSection = dynamic(() => import('@/components/TestimonialsSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const SafetyGuideSection = dynamic(() => import('@/components/SafetyGuideSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const BlogHighlightsSection = dynamic(() => import('@/components/BlogHighlightsSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const PhotoGallerySection = dynamic(() => import('@/components/PhotoGallerySection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const PartnersSection = dynamic(() => import('@/components/PartnersSection'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

const StatsSection = dynamic(() => import('@/components/StatsSection'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" />
});

const FAQSection = dynamic(() => import('@/components/FAQSection'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const About = dynamic(() => import('@/components/About'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
});

const FloatingChatbot = dynamic(() => import('@/components/FloatingChatbot'));

const ShareButtons = dynamic(() => import('@/components/ShareButtons'));

import { getHomepageFAQs } from '@/lib/faq-api';
import faqData from '@/lib/faq-data';
import type { Metadata } from 'next';

// Add caching for homepage
export const revalidate = 1800; // ISR: revalidate every 30 minutes

export const metadata: Metadata = {
  title: 'Guided Himalayan Treks in India',
  description: 'Book guided Himalayan treks with certified experts. Kedarkantha, Valley of Flowers, Hampta Pass, Brahmatal, and more.',
  alternates: {
    canonical: '/',
  },
};

export default async function HomePage() {
  // Fetch FAQs from database
  const dynamicFaqs = await getHomepageFAQs(6);
  
  // Use dynamic FAQs if available, otherwise fallback to hardcoded FAQs
  const faqs = dynamicFaqs.length > 0 
    ? dynamicFaqs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
        id: faq.id,
        is_featured: faq.is_featured,
        view_count: faq.view_count,
        priority_score: faq.priority_score
      }))
    : faqData.slice(0, 6); // Fallback to hardcoded FAQs

  return (
    <div className="content-wrapper relative z-[1]">
      <main>
        <div className="relative">
          <span role="heading" aria-level={1} className="sr-only">Guided Himalayan trekking tours in India by Trek Hub India</span>
          <OptimizedHeroSlider />
        </div>
        <UpcomingTreks />
        <WhyChooseUs />
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <Expertise />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <FeaturedTreksSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <TrekLeadersSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <SeasonalTrekkingCalendar />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <OptimizedTrekDestinationsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <TestimonialsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <SafetyGuideSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <BlogHighlightsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <PhotoGallerySection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <PartnersSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <StatsSection />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <FAQSection 
            faqs={faqs} 
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about Himalayan trekking"
            maxItems={6}
          />
        </Suspense>
        
        <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg mx-4 my-8" />}>
          <About />
        </Suspense>
              </main>
        <Footer />
        <FloatingChatbot />
        <ShareButtons layout="floating" />
      </div>
  );
}