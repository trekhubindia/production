/* eslint-disable */
import { notFound } from 'next/navigation';
import Image from 'next/image';
import type { Metadata } from 'next';
import { Calendar, MapPin, Mountain, Users, ArrowLeft, Clock, Thermometer, Navigation, Camera, Shield, Award } from 'lucide-react';
import GallerySection from '@/components/GallerySection';
import CostTermsTabs from '@/components/CostTermsTabs';
import { getTrekBySlug, getStaticPaths, Trek } from '@/lib/trek-data';
import ExpiredBookingMessage from '@/components/ExpiredBookingMessage';
import TrekFAQSection from '@/components/TrekFAQSection';
import StickyBackButton from '@/components/StickyBackButton';
import ModernBookingCard from '@/components/ModernBookingCard';

function TrekDetailsSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 animate-pulse">
      <div className="relative h-[60vh] w-full bg-gray-200 dark:bg-gray-700" />
      <div className="max-w-none mx-auto grid grid-cols-1 2xl:grid-cols-[1fr_400px] gap-12 px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
        <div className="space-y-10">
          <div className="h-10 w-2/3 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-8 w-1/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
        <div className="hidden 2xl:block">
          <div className="sticky top-8 bg-gray-200 dark:bg-gray-700 rounded-lg h-80" />
        </div>
      </div>
    </div>
  );
}

// ISR: revalidate every 60 seconds
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const trek = await getTrekBySlug(slug);
  
  if (!trek) return {};
  
  const overview = (trek.sections?.overview ?? {}) as { description?: string; trekName?: string };
  const heroImage = trek.gallery?.[0]?.url || trek.image || '/images/placeholder.jpg';
  const description = overview.description ?? overview.trekName ?? trek.name ?? 'Trek details';
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yourdomain.com'}/treks/${slug}`;
  
  return {
    title: `${trek.name} | Trek Hub India`,
    description,
    openGraph: {
      title: trek.name,
      description,
      url,
      images: [
        {
          url: heroImage,
          width: 1200,
          height: 630,
          alt: trek.name,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: trek.name,
      description,
      images: [heroImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export async function generateStaticParams() {
  return getStaticPaths().map(p => ({ slug: p.params.slug }));
}

function HighlightsSection({ highlights }: { highlights: string[] }) {
  if (!highlights || highlights.length === 0) return null;
  
  return (
    <section className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Key Highlights</h2>
        <p className="text-gray-600 dark:text-gray-400">Notable features and attractions</p>
      </div>
      
      <div className="space-y-3">
        {highlights.map((highlight, i) => (
          <div key={i} className="flex items-start gap-3 py-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{highlight}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function OverviewSection({ overview }: { overview: Record<string, unknown> }) {
  if (!overview) return null;
  const labelMap: Record<string, { label: string; icon: any }> = {
    trekName: { label: 'Trek Name', icon: Mountain },
    country: { label: 'Country', icon: MapPin },
    location: { label: 'Location', icon: Navigation },
    days: { label: 'Duration', icon: Calendar },
    altitude: { label: 'Max Altitude', icon: Thermometer },
    distance: { label: 'Distance', icon: Navigation },
    adventureType: { label: 'Adventure Type', icon: Camera },
    difficulty: { label: 'Difficulty', icon: Mountain },
    grade: { label: 'Grade', icon: Award },
    trailType: { label: 'Trail Type', icon: Navigation },
    baseCamp: { label: 'Base Camp', icon: Mountain },
    railHead: { label: 'Rail Head', icon: MapPin },
    airport: { label: 'Airport', icon: MapPin },
    season: { label: 'Best Season', icon: Calendar },
    stay: { label: 'Accommodation', icon: Shield },
    month: { label: 'Best Months', icon: Calendar },
    food: { label: 'Food', icon: Users },
  };
  
  const filteredEntries = Object.entries(labelMap).filter(([key]) => overview[key]);
  
  return (
    <section className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Trek Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Essential details and specifications</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        {filteredEntries.map(([key, { label, icon: Icon }]) => (
          <div key={key} className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-gray-800">
            <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {Array.isArray(overview[key])
                  ? overview[key].join(', ')
                  : typeof overview[key] === 'string' || typeof overview[key] === 'number'
                    ? overview[key]
                    : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RichTextSection({ title, html, icon: Icon }: { title: string; html: string; icon?: any }) {
  if (!html) return null;
  
  return (
    <section className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
      </div>
      
      <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white prose-ul:text-gray-700 dark:prose-ul:text-gray-300 prose-li:text-gray-700 dark:prose-li:text-gray-300" 
           dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

function ItinerarySection({ itinerary }: { itinerary: unknown[] }) {
  if (!itinerary || itinerary.length === 0) return null;
  return (
    <section className="space-y-6">
       <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Itinerary</h2>
        <p className="text-gray-600 dark:text-gray-400">Day-by-day schedule and activities</p>
      </div>
      
      <div className="space-y-6">
        {(itinerary as Array<{ day_number: number; title?: string; altitude?: string; distance?: string; description?: string }>).map((item, idx) => (
          <div key={item.day_number} className="flex gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {item.day_number}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Day {item.day_number}
                  {item.title && `: ${item.title}`}
                </h3>
                {item.altitude && (
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                    {item.altitude}
                  </span>
                )}
                {item.distance && (
                  <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                    {item.distance}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EssentialsSection({ essentials }: { essentials: { item: string }[] }) {
  if (!essentials || essentials.length === 0) return null;
  return (
    <section className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Essential Items</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Required equipment and gear</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
        {essentials.map((essential, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full flex-shrink-0"></div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">{essential.item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function Page({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ expired?: string }>;
}) {
  const { slug } = await params;
  const { expired } = (await searchParams) || {};
  const trek = await getTrekBySlug(slug);

  // Show skeleton while loading
  if (!trek) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trek Not Found</h2>
          <div className="text-gray-600 dark:text-gray-300 mb-2">Trek with slug "{slug}" not found in the database.</div>
          <div className="text-gray-600 dark:text-gray-300 mb-2">Available treks: {getStaticPaths().map(p => p.params.slug).join(', ')}</div>
        </div>
      </div>
    );
  }

  const sections = trek.sections || {};
  const overview = {
    ...(sections.overview || {}),
    // Override with main trek data to ensure consistency
    days: trek.duration,
    difficulty: trek.difficulty,
    location: trek.region
  };
  const highlights = sections.overview?.highlights || [];
  // Check both sections and root level for these fields
  const whoCanParticipate = sections.whoCanParticipate || trek.whoCanParticipate || '';
  const howToReach = sections.howToReach || trek.howToReach || '';
  const costTerms = sections.costTerms || trek.costTerms || { inclusions: [], exclusions: [] };
  const itinerary = sections.itinerary || trek.itinerary || [];
  const essentials = sections.trekEssentials || trek.trekEssentials || { clothing: [], footwear: [], accessories: [], documents: [] };
  const gallery = trek.gallery || [];
  const slots = trek.slots ?? undefined;
  const heroImage = trek.image || gallery[0]?.url || '/images/placeholder.jpg';
  const cancellationPolicy = trek.cancellationPolicy;

  // Parse itinerary as array of objects if it's a string
  const itineraryArray = Array.isArray(itinerary) ? itinerary : [];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Sticky Back Button */}
      <StickyBackButton />
      
      {/* Expired Booking Message */}
      {expired === 'true' && <ExpiredBookingMessage trekName={trek.name} />}
      
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <Image
          src={heroImage}
          alt={trek.name}
          fill
          className="object-cover object-center"
          priority
        />
        {/* Professional gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80" />
        
        {/* Top Navigation Bar */}
        <div className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-none mx-auto pl-6 pr-3 sm:pl-8 sm:pr-4 lg:pl-12 lg:pr-6 py-6">
            {/* Empty space for back button */}
            <div className="h-12 mb-4"></div>
            
            {/* Breadcrumb below back button area */}
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <span>Treks</span>
              <span>/</span>
              <span className="text-white font-medium">{trek.name}</span>
            </div>
          </div>
        </div>
        
        {/* Hero Content */}
        <div className="absolute inset-0 flex items-end">
          <div className="w-full max-w-none mx-auto pl-6 pr-3 sm:pl-8 sm:pr-4 lg:pl-12 lg:pr-6 pb-16">
            <div className="max-w-5xl">
              {/* Main Content */}
              <div>
                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 px-4 py-2 rounded-full text-sm font-medium text-white mb-6 shadow-lg">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  Available for Booking
                </div>
                
                {/* Title */}
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white mb-6 leading-[0.9] tracking-tight">
                  {trek.name}
                </h1>
                
                {/* Description */}
                {trek.description && (
                  <p className="text-lg text-white/90 mb-8 max-w-2xl leading-relaxed font-light">
                    {trek.description.substring(0, 180)}...
                  </p>
                )}
                
                {/* Key Highlights */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {trek.region && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-colors duration-300">
                      <MapPin className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                      <div className="text-xs text-white/70 mb-1">Region</div>
                      <div className="text-sm font-semibold text-white">{trek.region}</div>
                    </div>
                  )}
                  {trek.duration && trek.duration.toString() !== '0' && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-colors duration-300">
                      <Calendar className="w-5 h-5 text-green-400 mx-auto mb-2" />
                      <div className="text-xs text-white/70 mb-1">Duration</div>
                      <div className="text-sm font-semibold text-white">
                        {trek.duration.toString().toLowerCase().includes('day') ? trek.duration : `${trek.duration} Days`}
                      </div>
                    </div>
                  )}
                  {trek.difficulty && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-colors duration-300">
                      <Mountain className={`w-5 h-5 mx-auto mb-2 ${
                        trek.difficulty?.toLowerCase() === 'easy' ? 'text-green-400' :
                        trek.difficulty?.toLowerCase() === 'moderate' ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                      <div className="text-xs text-white/70 mb-1">Difficulty</div>
                      <div className="text-sm font-semibold text-white">{trek.difficulty}</div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>
          </div>
        </div>
        
      </div>
      
      {/* Main Content */}
      <div className="max-w-none mx-auto px-6 sm:px-8 lg:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_400px] gap-8">
          {/* Main Content */}
          <div className="space-y-12">
            <OverviewSection overview={overview} />
            <HighlightsSection highlights={Array.isArray(highlights) ? highlights : []} />
            <RichTextSection title="Who Can Participate" html={whoCanParticipate} icon={Users} />
            <ItinerarySection itinerary={itineraryArray
              .filter((d: any, i: number) => {
                // Filter out days that exceed the trek duration
                const trekDuration = parseInt(trek.duration?.toString().replace(/[^0-9]/g, '') || '0');
                const dayNumber = d.day || d.day_number || i + 1;
                return trekDuration > 0 ? dayNumber <= trekDuration : true;
              })
              .map((d: any, i: number) => ({
                day_number: d.day || d.day_number || i + 1,
                description: d.description || d.title || d.activity || d,
                title: d.title,
                altitude: d.altitude,
                distance: d.distance,
              }))} />
            <RichTextSection title="How To Reach" html={howToReach} />
            <EssentialsSection essentials={
              Object.values(essentials)
                .filter((v): v is string[] => Array.isArray(v) && v.every(i => typeof i === 'string'))
                .reduce<string[]>((acc, arr) => acc.concat(arr), [])
                .map((item: string) => ({ item }))
            } />
            <CostTermsTabs costTerms={[
              ...(costTerms.inclusions || []).map((item: string) => ({ type: 'inclusion', item })),
              ...(costTerms.exclusions || []).map((item: string) => ({ type: 'exclusion', item }))
            ]} cancellationPolicy={cancellationPolicy} />
            <GallerySection gallery={gallery} />
            <TrekFAQSection 
              trekId={trek.id}
              trekSlug={trek.slug}
              trekName={trek.name}
            />
          </div>
          
          {/* Booking Card Sidebar */}
          <div className="lg:block">
            <ModernBookingCard
              price={trek.price}
              slots={typeof slots === 'number' ? slots : (Array.isArray(slots) ? slots.length : 0)}
              slug={trek.slug}
              trekName={trek.name}
              duration={trek.duration}
              difficulty={trek.difficulty}
              region={trek.region}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 