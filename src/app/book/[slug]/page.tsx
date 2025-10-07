import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTreks, Trek } from '@/lib/trek-data';
import BookingFormWrapper from '@/components/BookingFormWrapper';
import AuthRequired from '@/components/AuthRequired';
import Footer from '@/components/Footer';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const treks = await getAllTreks();
  const trek = treks.find((t: Trek) => t.slug === slug);

  if (!trek) {
    return {
      title: 'Trek Not Found | Trek Hub India',
      description: 'The requested trek could not be found.',
    };
  }

  return {
    title: `Book ${trek.name} | Trek Hub India`,
    description: `Book your adventure for ${trek.name}. Submit your booking request for admin approval.`,
    keywords: `${trek.name}, trek booking, himalayan trek, adventure booking`,
    openGraph: {
      title: `Book ${trek.name} | Trek Hub India`,
      description: `Book your adventure for ${trek.name}. Submit your booking request for admin approval.`,
      type: 'website',
      url: `https://trekhubindia.com/book/${trek.slug}`,
    },
    alternates: {
      canonical: `https://trekhubindia.com/book/${trek.slug}`,
    },
  };
}

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const treks = await getAllTreks();
  const trek = treks.find((t: Trek) => t.slug === slug);

  if (!trek) {
    notFound();
  }

  return (
    <AuthRequired
      promptTitle="Sign in to book your trek"
      promptMessage="To book this amazing trek, you'll need to sign in to your account. This helps us keep your booking secure and provide you with the best experience."
      promptActionText="Sign In to Book"
    >
      <>
        {/* Booking Section */}
        <section className="py-8 sm:py-12 lg:py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
              {/* Trek Details */}
              <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
                <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    {trek.name}
                  </h2>
                  
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm sm:text-base">📍</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Location</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{trek.region}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-sm sm:text-base">⏱️</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Duration</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{trek.duration} Days</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 dark:text-purple-400 font-semibold text-sm sm:text-base">🏔️</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Difficulty</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{trek.difficulty}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600 dark:text-yellow-400 font-semibold text-sm sm:text-base">⭐</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Rating</div>
                        <div className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{trek.rating || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl">
                    <div className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                      ₹{trek.price?.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">per person (incl. 5% GST)</div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    What&apos;s Included
                  </h3>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Professional trekking guide</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">All permits and fees</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Accommodation during trek</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Meals (breakfast, lunch, dinner)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">Transportation to and from trek</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs sm:text-sm">✓</span>
                      </div>
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">First aid and safety equipment</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Booking Form */}
              <div className="order-1 lg:order-2">
                <BookingFormWrapper trek={trek} />
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </>
    </AuthRequired>
  );
} 