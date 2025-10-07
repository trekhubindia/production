 

import OptimizedHeroSlider from '@/components/OptimizedHeroSlider';
import UpcomingTreks from '@/components/UpcomingTreks';
import WhyChooseUs from '@/components/WhyChooseUs';
import Expertise from '@/components/Expertise';
import FeaturedTreksSection from '@/components/FeaturedTreksSection';
import TrekLeadersSection from '@/components/TrekLeadersSection';
import SeasonalTrekkingCalendar from '@/components/AdventureHighlightsSection';
import OptimizedTrekDestinationsSection from '@/components/OptimizedTrekDestinationsSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import SafetyGuideSection from '@/components/SafetyGuideSection';
import BlogHighlightsSection from '@/components/BlogHighlightsSection';
import PhotoGallerySection from '@/components/PhotoGallerySection';
import PartnersSection from '@/components/PartnersSection';
import StatsSection from '@/components/StatsSection';
import FAQSection from '@/components/FAQSection';
import About from '@/components/About';
import Footer from '@/components/Footer';
import FloatingChatbot from '@/components/FloatingChatbot';
import ShareButtons from '@/components/ShareButtons';

import { getHomepageFAQs } from '@/lib/faq-api';
import faqData from '@/lib/faq-data';
import type { Metadata } from 'next';

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
        <Expertise />
        <FeaturedTreksSection />
        <TrekLeadersSection />
        <SeasonalTrekkingCalendar />
        <OptimizedTrekDestinationsSection />
        <TestimonialsSection />
        <SafetyGuideSection />
        <BlogHighlightsSection />
        <PhotoGallerySection />
        <PartnersSection />
        <StatsSection />
        <FAQSection 
          faqs={faqs} 
          title="Frequently Asked Questions"
          subtitle="Everything you need to know about Himalayan trekking"
          maxItems={6}
        />
        <About />
              </main>
        <Footer />
        <FloatingChatbot />
        <ShareButtons layout="floating" />
      </div>
  );
}