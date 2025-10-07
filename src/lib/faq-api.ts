import { supabaseAdmin } from '@/lib/supabase';
import { createFAQCache, CACHE_DURATIONS } from './cache';

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_featured: boolean;
  trek_slug?: string;
  trek_name?: string;
  created_at: string;
  view_count?: number;
  priority_score?: number;
  last_shown_homepage?: string;
  homepage_show_count?: number;
  seasonal_relevance?: string;
  tags?: string[];
}

export interface FAQResponse {
  faqs: FAQ[];
  total: number;
}

/**
 * Internal function to fetch FAQs from database (will be cached)
 */
async function _getFAQs(options: {
  limit?: number;
  featured?: boolean;
  trek_slug?: string;
} = {}): Promise<FAQResponse> {
  try {
    const { limit = 20, featured = false, trek_slug } = options;

    // Build query for public FAQs with basic columns that should exist
    let query = supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_featured,
        created_at
      `);

    // Only add status filter if the column exists
    try {
      query = query.eq('status', 'answered');
    } catch (e) {
      // If status column doesn't exist, continue without it
      console.warn('Status column not found, fetching all FAQs');
    }

    // Ensure answer exists
    query = query.not('answer', 'is', null);

    // Filter by featured if requested
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Apply basic ordering
    const { data: faqs, error } = await query
      .order('is_featured', { ascending: false }) // Featured first
      .order('created_at', { ascending: false }) // Most recent
      .limit(limit);

    if (error) {
      console.error('Error fetching FAQs:', error);
      // Return empty result instead of throwing to prevent page crashes
      return {
        faqs: [],
        total: 0
      };
    }

    // Transform data with safe property access
    const transformedFaqs: FAQ[] = (faqs || []).map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      is_featured: faq.is_featured || false,
      trek_slug: undefined, // Not available in current schema
      trek_name: undefined, // Not available in current schema
      created_at: faq.created_at,
      view_count: 0, // Default value
      priority_score: 0, // Default value
      last_shown_homepage: undefined,
      homepage_show_count: 0,
      seasonal_relevance: undefined,
      tags: []
    }));

    return {
      faqs: transformedFaqs,
      total: transformedFaqs.length
    };

  } catch (error) {
    console.error('getFAQs error:', error);
    return {
      faqs: [],
      total: 0
    };
  }
}

// Cached version of getFAQs
export const getFAQs = createFAQCache(
  _getFAQs,
  'faqs',
  CACHE_DURATIONS.LONG
);

/**
 * Update FAQ priority scores for all FAQs
 * Note: This function is disabled as the database function doesn't exist
 */
export async function updateFAQPriorityScores(): Promise<number> {
  try {
    // Database function 'update_all_faq_priority_scores' doesn't exist
    // Return 0 to indicate no updates were made
    console.log('FAQ priority score update skipped - database function not available');
    return 0;
  } catch (error) {
    console.error('updateFAQPriorityScores error:', error);
    return 0;
  }
}

/**
 * Mark FAQs as shown on homepage (for rotation tracking)
 * Note: This function is disabled as the database function doesn't exist
 */
export async function markFAQsShownOnHomepage(faqIds: string[]): Promise<void> {
  try {
    // Database function 'mark_faqs_shown_on_homepage' doesn't exist
    // Skip this operation silently
    console.log('FAQ homepage tracking skipped - database function not available');
  } catch (error) {
    console.error('markFAQsShownOnHomepage error:', error);
  }
}

/**
 * Increment view count for an FAQ
 * Note: This function is disabled as the database function doesn't exist
 */
export async function incrementFAQViewCount(faqId: string): Promise<void> {
  try {
    // Database function 'increment_faq_view_count' doesn't exist
    // Skip this operation silently
    console.log('FAQ view count increment skipped - database function not available');
  } catch (error) {
    console.error('incrementFAQViewCount error:', error);
  }
}

/**
 * Get FAQs for homepage with graceful fallback
 */
export async function getHomepageFAQs(limit: number = 6): Promise<FAQ[]> {
  try {
    // Skip priority score updates (database function doesn't exist)
    // Just get FAQs directly
    const response = await getFAQs({ limit, featured: false });
    const selectedFAQs = response.faqs;
    
    // Skip homepage tracking (database function doesn't exist)
    
    return selectedFAQs;
  } catch (error) {
    console.error('getHomepageFAQs error:', error);
    return [];
  }
}

/**
 * Get seasonal FAQs based on current time of year
 * Simplified version that works with basic schema
 */
export async function getSeasonalFAQs(limit: number = 3): Promise<FAQ[]> {
  try {
    // Just get basic FAQs since seasonal_relevance column may not exist
    const { data: faqs, error } = await supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_featured,
        created_at
      `)
      .not('answer', 'is', null)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching seasonal FAQs:', error);
      return [];
    }
    
    return (faqs || []).map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      is_featured: faq.is_featured || false,
      seasonal_relevance: undefined,
      priority_score: 0,
      created_at: faq.created_at || '',
      trek_slug: undefined,
      trek_name: undefined
    }));
    
  } catch (error) {
    console.error('getSeasonalFAQs error:', error);
    return [];
  }
}
