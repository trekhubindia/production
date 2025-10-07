// Google Analytics gtag utility functions
export const GA_TRACKING_ID = 'G-582SPBJ9HH';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Custom events for trekking website
export const trackTrekView = (trekName: string, trekSlug: string) => {
  event({
    action: 'view_trek',
    category: 'Trek',
    label: `${trekName} (${trekSlug})`,
  });
};

export const trackBookingStart = (trekName: string, trekSlug: string) => {
  event({
    action: 'begin_checkout',
    category: 'Booking',
    label: `${trekName} (${trekSlug})`,
  });
};

export const trackBookingComplete = (trekName: string, trekSlug: string, amount: number) => {
  event({
    action: 'purchase',
    category: 'Booking',
    label: `${trekName} (${trekSlug})`,
    value: amount,
  });
};

export const trackFAQView = (question: string) => {
  event({
    action: 'view_faq',
    category: 'FAQ',
    label: question,
  });
};

export const trackSearchQuery = (query: string, results: number) => {
  event({
    action: 'search',
    category: 'Search',
    label: query,
    value: results,
  });
};

export const trackNewsletterSignup = (location: string) => {
  event({
    action: 'newsletter_signup',
    category: 'Newsletter',
    label: location,
  });
};

export const trackWishlistAdd = (trekName: string) => {
  event({
    action: 'add_to_wishlist',
    category: 'Wishlist',
    label: trekName,
  });
};

export const trackContactForm = (formType: string) => {
  event({
    action: 'contact_form_submit',
    category: 'Contact',
    label: formType,
  });
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js',
      targetId: string | Date,
      config?: any
    ) => void;
  }
}
