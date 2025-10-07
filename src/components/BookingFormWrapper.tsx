'use client';

import { Trek } from '@/lib/trek-data';
import EnhancedBookingForm from './EnhancedBookingForm';

interface BookingFormWrapperProps {
  trek: Trek;
}

export default function BookingFormWrapper({ trek }: BookingFormWrapperProps) {
  return (
    <EnhancedBookingForm 
      trekSlug={trek.slug}
      trekName={trek.name}
      trekPrice={trek.price || 0}
    />
  );
} 