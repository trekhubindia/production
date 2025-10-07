'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Calendar, User, MoreVertical } from 'lucide-react';
import StarRating from './StarRating';
import { TrekRating, RatingFilters } from '@/lib/types/rating-types';
import { useAuth } from '@/hooks/context/AuthContext';

interface RatingsListProps {
  trekId?: string;
  userId?: string;
  initialRatings?: TrekRating[];
  showTrekName?: boolean;
  limit?: number;
}

export default function RatingsList({
  trekId,
  userId,
  initialRatings,
  showTrekName = false,
  limit = 10
}: RatingsListProps) {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<TrekRating[]>(initialRatings || []);
  const [loading, setLoading] = useState(!initialRatings);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful'>('newest');
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!initialRatings) {
      fetchRatings();
    }
  }, [trekId, userId, sortBy]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (trekId) params.append('trek_id', trekId);
      if (userId) params.append('user_id', userId);
      params.append('limit', limit.toString());
      params.append('sort_by', sortBy);

      const response = await fetch(`/api/ratings?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRatings(data.ratings || []);
      } else {
        console.error('Error fetching ratings:', data.error);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpfulVote = async (ratingId: string, isHelpful: boolean) => {
    if (!user) return;

    try {
      if (isHelpful) {
        // Remove helpful vote
        const response = await fetch(`/api/ratings/helpful?rating_id=${ratingId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setHelpfulVotes(prev => ({ ...prev, [ratingId]: false }));
          // Update helpful count in ratings
          setRatings(prev => prev.map(rating => 
            rating.id === ratingId 
              ? { ...rating, helpful_count: Math.max(0, rating.helpful_count - 1) }
              : rating
          ));
        }
      } else {
        // Add helpful vote
        const response = await fetch('/api/ratings/helpful', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating_id: ratingId })
        });
        
        if (response.ok) {
          const data = await response.json();
          setHelpfulVotes(prev => ({ ...prev, [ratingId]: true }));
          // Update helpful count in ratings
          setRatings(prev => prev.map(rating => 
            rating.id === ratingId 
              ? { ...rating, helpful_count: data.helpful_count }
              : rating
          ));
        }
      }
    } catch (error) {
      console.error('Error voting helpful:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No ratings yet</h3>
        <p className="text-muted-foreground">
          Be the first to share your experience with this trek!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Reviews ({ratings.length})
        </h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest_rated">Highest Rated</option>
          <option value="lowest_rated">Lowest Rated</option>
          <option value="most_helpful">Most Helpful</option>
        </select>
      </div>

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <div key={rating.id} className="bg-card rounded-lg border p-6">
            <div className="flex items-start gap-4">
              {/* User Avatar */}
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                {rating.user_avatar ? (
                  <img 
                    src={rating.user_avatar} 
                    alt={rating.user_name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-foreground">
                        {rating.user_name || 'Anonymous User'}
                      </h4>
                      {rating.trek_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(rating.trek_date)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <StarRating rating={rating.rating} readonly size="sm" />
                      <span className="text-sm text-muted-foreground">
                        {formatDate(rating.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {showTrekName && rating.trek_name && (
                    <div className="text-sm text-muted-foreground">
                      {rating.trek_name}
                    </div>
                  )}
                </div>

                {/* Detailed Ratings */}
                {(rating.difficulty_rating || rating.guide_rating || rating.value_rating || rating.organization_rating) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-muted/20 rounded-lg">
                    {rating.difficulty_rating && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                        <StarRating rating={rating.difficulty_rating} readonly size="sm" />
                      </div>
                    )}
                    {rating.guide_rating && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Guide</div>
                        <StarRating rating={rating.guide_rating} readonly size="sm" />
                      </div>
                    )}
                    {rating.value_rating && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Value</div>
                        <StarRating rating={rating.value_rating} readonly size="sm" />
                      </div>
                    )}
                    {rating.organization_rating && (
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Organization</div>
                        <StarRating rating={rating.organization_rating} readonly size="sm" />
                      </div>
                    )}
                  </div>
                )}

                {/* Review Text */}
                {rating.review && (
                  <p className="text-foreground mb-4 leading-relaxed">
                    {rating.review}
                  </p>
                )}

                {/* Recommendation */}
                {rating.would_recommend !== null && (
                  <div className="flex items-center gap-2 mb-4">
                    {rating.would_recommend ? (
                      <>
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          Recommends this trek
                        </span>
                      </>
                    ) : (
                      <>
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        <span className="text-sm text-red-600 font-medium">
                          Doesn't recommend this trek
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4">
                    {user && user.id !== rating.user_id && (
                      <button
                        onClick={() => handleHelpfulVote(rating.id, helpfulVotes[rating.id] || false)}
                        className={`
                          flex items-center gap-1 text-sm transition-colors
                          ${helpfulVotes[rating.id] 
                            ? 'text-primary' 
                            : 'text-muted-foreground hover:text-foreground'
                          }
                        `}
                      >
                        <ThumbsUp className="w-4 h-4" />
                        Helpful ({rating.helpful_count})
                      </button>
                    )}
                    
                    {!user && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <ThumbsUp className="w-4 h-4" />
                        Helpful ({rating.helpful_count})
                      </div>
                    )}
                  </div>

                  {user && user.id === rating.user_id && (
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
