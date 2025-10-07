'use client';

import { Trek } from '@/lib/trek-data';
import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load the heavy booking form
const EnhancedBookingForm = lazy(() => import('./EnhancedBookingForm'));

interface BookingFormWrapperProps {
  trek: Trek;
}

function BookingFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <Skeleton className="h-12 w-32" />
    </div>
  );
}

export default function BookingFormWrapper({ trek }: BookingFormWrapperProps) {
  return (
    <Suspense fallback={<BookingFormSkeleton />}>
      <EnhancedBookingForm 
        trekSlug={trek.slug}
        trekName={trek.name}
        trekPrice={trek.price || 0}
      />
    </Suspense>
  );
}