// Cache utility for database queries
import { unstable_cache } from 'next/cache';

// Cache configuration
const CACHE_TAGS = {
  TREKS: 'treks',
  TREK_SLOTS: 'trek-slots',
  TREK_IMAGES: 'trek-images',
  FAQS: 'faqs',
  BLOGS: 'blogs',
} as const;

export const CACHE_DURATIONS = {
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
} as const;

// Generic cache wrapper
export function createCachedFunction<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  tags: string[],
  revalidate: number = CACHE_DURATIONS.MEDIUM
) {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      tags,
      revalidate,
    }
  );
}

// Specific cache functions for trek data
export const createTrekCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.MEDIUM
) => createCachedFunction(
  fn,
  keyPrefix,
  [CACHE_TAGS.TREKS, CACHE_TAGS.TREK_SLOTS, CACHE_TAGS.TREK_IMAGES],
  revalidate
);

export const createFAQCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.LONG
) => createCachedFunction(
  fn,
  keyPrefix,
  [CACHE_TAGS.FAQS],
  revalidate
);

export const createBlogCache = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyPrefix: string,
  revalidate: number = CACHE_DURATIONS.LONG
) => createCachedFunction(
  fn,
  keyPrefix,
  [CACHE_TAGS.BLOGS],
  revalidate
);

// Cache invalidation helpers
export { revalidateTag, revalidatePath } from 'next/cache';

// Utility to invalidate all trek-related caches
export function invalidateTrekCaches() {
  const { revalidateTag } = require('next/cache');
  revalidateTag(CACHE_TAGS.TREKS);
  revalidateTag(CACHE_TAGS.TREK_SLOTS);
  revalidateTag(CACHE_TAGS.TREK_IMAGES);
}

// Utility to invalidate FAQ caches
export function invalidateFAQCaches() {
  const { revalidateTag } = require('next/cache');
  revalidateTag(CACHE_TAGS.FAQS);
}

// Utility to invalidate blog caches
export function invalidateBlogCaches() {
  const { revalidateTag } = require('next/cache');
  revalidateTag(CACHE_TAGS.BLOGS);
}
