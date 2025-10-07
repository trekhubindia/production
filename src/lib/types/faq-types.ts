export interface TrekFAQ {
  id: string;
  trek_id: string;
  user_id: string;
  question: string;
  answer?: string;
  is_anonymous: boolean;
  is_answered: boolean;
  is_featured: boolean;
  is_approved: boolean;
  answered_by?: string;
  answered_at?: string;
  upvotes: number;
  downvotes: number;
  views: number;
  category: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  
  // Joined data
  user_name?: string;
  user_avatar?: string;
  answerer_name?: string;
  trek_name?: string;
  trek_slug?: string;
}

export interface FAQVote {
  id: string;
  faq_id: string;
  user_id: string;
  vote_type: 'upvote' | 'downvote';
  created_at: string;
}

export interface TrekFAQStats {
  trek_id: string;
  trek_slug: string;
  total_questions: number;
  answered_questions: number;
  approved_questions: number;
  featured_questions: number;
  avg_upvotes: number;
  total_views: number;
  latest_question_date?: string;
}

export interface CreateFAQRequest {
  trek_id: string;
  question: string;
  is_anonymous?: boolean;
  category?: string;
  tags?: string[];
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  is_anonymous?: boolean;
  is_answered?: boolean;
  is_featured?: boolean;
  is_approved?: boolean;
  category?: string;
  tags?: string[];
}

export interface FAQFilters {
  trek_id?: string;
  user_id?: string;
  category?: string;
  is_answered?: boolean;
  is_approved?: boolean;
  is_featured?: boolean;
  search?: string;
  sort_by?: 'newest' | 'oldest' | 'most_upvoted' | 'most_viewed' | 'unanswered';
  limit?: number;
  offset?: number;
}

export interface FAQFormData {
  question: string;
  is_anonymous: boolean;
  category: string;
}

export const FAQ_CATEGORIES = {
  general: 'General',
  timing: 'Best Time to Visit',
  difficulty: 'Difficulty & Fitness',
  permits: 'Permits & Documentation',
  accommodation: 'Accommodation',
  packing: 'Packing & Gear',
  food: 'Food & Meals',
  transportation: 'Transportation',
  safety: 'Safety & Health',
  cost: 'Cost & Payment',
  weather: 'Weather Conditions',
  itinerary: 'Itinerary & Schedule'
} as const;

export const FAQ_SORT_OPTIONS = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  most_upvoted: 'Most Upvoted',
  most_viewed: 'Most Viewed',
  unanswered: 'Unanswered First'
} as const;

export type FAQCategory = keyof typeof FAQ_CATEGORIES;
export type FAQSortOption = keyof typeof FAQ_SORT_OPTIONS;
