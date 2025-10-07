import Footer from '@/components/Footer';
import { Metadata } from 'next';
import { getAllTreks } from '@/lib/trek-data';
import ImprovedTreksPage from '@/components/ImprovedTreksPage';

export const revalidate = 900; // ISR: revalidate every 15 minutes (optimized for trek data)

export const metadata: Metadata = {
  title: 'All Himalayan Treks',
  description: 'Explore our complete collection of Himalayan treks. From beginner-friendly trails to challenging expeditions, find your perfect adventure.',
  keywords: 'himalayan treks, trekking tours, adventure treks, mountain hiking, trek packages',
  openGraph: {
    title: 'All Himalayan Treks',
    description: 'Discover amazing Himalayan adventures with our complete trek collection.',
    type: 'website',
    url: 'https://nomadictravels.shop/treks',
  },
};

export default async function TreksPage() {
  try {
    // Get all treks from JSON + database dynamic data
    const treks = await getAllTreks();

    // Log for debugging
    console.log('Hybrid data response:', { treks: treks.length });

    return (
      <>
        <ImprovedTreksPage treks={treks} />
        <Footer />
      </>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 max-w-md mx-4">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 text-red-500">⚠️</div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Unexpected Error</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">Something went wrong. Please try again later.</p>
            <p className="text-sm text-red-500 mb-6">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <a
              href="/treks"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
            >
              Retry
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }
}