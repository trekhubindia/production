export interface TrekRating {
  id: string;
  user_id: string;
  trek_id: string;
  booking_id?: string;
  rating: number; // 1-5 stars
  review?: string;
  difficulty_rating?: number; // 1-5 stars
  guide_rating?: number; // 1-5 stars
  value_rating?: number; // 1-5 stars
  organization_rating?: number; // 1-5 stars
  would_recommend: boolean;
  trek_date?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  user_name?: string;
  user_avatar?: string;
  trek_name?: string;
  trek_slug?: string;
}

export interface RatingHelpful {
  id: string;
  rating_id: string;
  user_id: string;
  created_at: string;
}

export interface TrekRatingStats {
  trek_id: string;
  trek_slug: string;
  total_ratings: number;
  average_rating: number;
  average_difficulty: number;
  average_guide_rating: number;
  average_value_rating: number;
  average_organization_rating: number;
  five_star_count: number;
  four_star_count: number;
  three_star_count: number;
  two_star_count: number;
  one_star_count: number;
  recommend_count: number;
  recommend_percentage: number;
}

export interface CreateRatingRequest {
  trek_id: string;
  booking_id?: string;
  rating: number;
  review?: string;
  difficulty_rating?: number;
  guide_rating?: number;
  value_rating?: number;
  organization_rating?: number;
  would_recommend?: boolean;
  trek_date?: string;
}

export interface UpdateRatingRequest {
  rating?: number;
  review?: string;
  difficulty_rating?: number;
  guide_rating?: number;
  value_rating?: number;
  organization_rating?: number;
  would_recommend?: boolean;
  trek_date?: string;
}

export interface RatingFilters {
  trek_id?: string;
  user_id?: string;
  rating?: number;
  would_recommend?: boolean;
  sort_by?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
  limit?: number;
  offset?: number;
}

export interface RatingFormData {
  rating: number;
  review: string;
  difficulty_rating: number;
  guide_rating: number;
  value_rating: number;
  organization_rating: number;
  would_recommend: boolean;
  trek_date: string;
}

export const RATING_CATEGORIES = {
  overall: 'Overall Experience',
  difficulty: 'Difficulty Level',
  guide: 'Guide Quality',
  value: 'Value for Money',
  organization: 'Organization'
} as const;

export const RATING_SORT_OPTIONS = {
  newest: 'Newest First',
  oldest: 'Oldest First',
  highest_rated: 'Highest Rated',
  lowest_rated: 'Lowest Rated',
  most_helpful: 'Most Helpful'
} as const;
