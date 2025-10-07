import { Metadata } from 'next';
import RatingSystem from '@/components/RatingSystem';

export const metadata: Metadata = {
  title: 'Rate Your Treks | Trek Hub India',
  description: 'Rate and review your completed treks to help other adventurers choose their next journey.',
};

export default function RatingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <RatingSystem />
    </div>
  );
}
