import { Suspense } from 'react';
import { Metadata } from 'next';
import BookingSuccessClient from './BookingSuccessClient';

export const metadata: Metadata = {
  title: 'Booking Submitted Successfully | Trek Hub India',
  description: 'Your booking request has been submitted successfully. Our team will review and approve it within 24 hours.',
  robots: 'noindex, nofollow', // Don't index success pages
};

interface BookingSuccessPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingSuccessPage({ params }: BookingSuccessPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <BookingSuccessClient bookingId={id} />
    </Suspense>
  );
}
