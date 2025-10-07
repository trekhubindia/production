import { supabaseAdmin } from '@/lib/supabase';

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
 * Fetch FAQs from database (server-side only)
 */
export async function getFAQs(options: {
  limit?: number;
  featured?: boolean;
  trek_slug?: string;
} = {}): Promise<FAQResponse> {
  try {
    const { limit = 20, featured = false, trek_slug } = options;

    // Build query for public FAQs (only answered and not hidden)
    let query = supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_featured,
        trek_slug,
        created_at,
        view_count,
        priority_score,
        last_shown_homepage,
        homepage_show_count,
        seasonal_relevance,
        tags,
        treks (
          name,
          slug
        )
      `)
      .eq('status', 'answered') // Only show answered FAQs
      .not('answer', 'is', null); // Ensure answer exists

    // Filter by featured if requested
    if (featured) {
      query = query.eq('is_featured', true);
    }

    // Filter by trek if specified
    if (trek_slug) {
      query = query.eq('trek_slug', trek_slug);
    }

    // Apply intelligent ordering for rotation
    const { data: faqs, error } = await query
      .order('priority_score', { ascending: false }) // Highest priority first
      .order('last_shown_homepage', { ascending: true, nullsFirst: false }) // Least recently shown
      .order('is_featured', { ascending: false }) // Featured as tiebreaker
      .limit(limit);

    if (error) {
      console.error('Error fetching FAQs:', error);
      throw new Error('Failed to fetch FAQs');
    }

    // Transform data
    const transformedFaqs: FAQ[] = (faqs || []).map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      is_featured: faq.is_featured,
      trek_slug: faq.trek_slug,
      trek_name: faq.treks ? (faq.treks as any).name : undefined,
      created_at: faq.created_at,
      view_count: faq.view_count || 0,
      priority_score: faq.priority_score || 0,
      last_shown_homepage: faq.last_shown_homepage,
      homepage_show_count: faq.homepage_show_count || 0,
      seasonal_relevance: faq.seasonal_relevance,
      tags: faq.tags || []
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

/**
 * Update FAQ priority scores for all FAQs
 */
export async function updateFAQPriorityScores(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc('update_all_faq_priority_scores');
    
    if (error) {
      console.error('Error updating FAQ priority scores:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('updateFAQPriorityScores error:', error);
    return 0;
  }
}

/**
 * Mark FAQs as shown on homepage (for rotation tracking)
 */
export async function markFAQsShownOnHomepage(faqIds: string[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('mark_faqs_shown_on_homepage', {
      faq_ids: faqIds
    });
    
    if (error) {
      console.error('Error marking FAQs as shown:', error);
    }
  } catch (error) {
    console.error('markFAQsShownOnHomepage error:', error);
  }
}

/**
 * Increment view count for an FAQ
 */
export async function incrementFAQViewCount(faqId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('increment_faq_view_count', {
      faq_id: faqId
    });
    
    if (error) {
      console.error('Error incrementing FAQ view count:', error);
    }
  } catch (error) {
    console.error('incrementFAQViewCount error:', error);
  }
}

/**
 * Get intelligently rotated FAQs for homepage
 */
export async function getHomepageFAQs(limit: number = 6): Promise<FAQ[]> {
  try {
    // First, update priority scores to ensure fresh rotation
    await updateFAQPriorityScores();
    
    // Get FAQs using intelligent rotation algorithm
    const response = await getFAQs({ limit, featured: false });
    const selectedFAQs = response.faqs;
    
    // Mark these FAQs as shown on homepage for rotation tracking
    if (selectedFAQs.length > 0) {
      const faqIds = selectedFAQs.map(faq => faq.id);
      await markFAQsShownOnHomepage(faqIds);
    }
    
    return selectedFAQs;
  } catch (error) {
    console.error('getHomepageFAQs error:', error);
    return [];
  }
}

/**
 * Get seasonal FAQs based on current time of year
 */
export async function getSeasonalFAQs(limit: number = 3): Promise<FAQ[]> {
  try {
    const currentMonth = new Date().getMonth() + 1;
    let season = 'all';
    
    if (currentMonth >= 3 && currentMonth <= 5) season = 'spring';
    else if (currentMonth >= 6 && currentMonth <= 8) season = 'summer';
    else if (currentMonth >= 9 && currentMonth <= 11) season = 'autumn';
    else season = 'winter';
    
    const { data: faqs, error } = await supabaseAdmin
      .from('trek_faqs')
      .select(`
        id,
        question,
        answer,
        is_featured,
        seasonal_relevance,
        priority_score
      `)
      .eq('status', 'answered')
      .or(`seasonal_relevance.eq.${season},seasonal_relevance.eq.all`)
      .order('priority_score', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching seasonal FAQs:', error);
      return [];
    }
    
    return (faqs || []).map(faq => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      is_featured: faq.is_featured,
      seasonal_relevance: faq.seasonal_relevance,
      priority_score: faq.priority_score,
      created_at: '',
      trek_slug: undefined,
      trek_name: undefined
    }));
    
  } catch (error) {
    console.error('getSeasonalFAQs error:', error);
    return [];
  }
}
