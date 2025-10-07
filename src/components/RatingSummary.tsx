'use client';

import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import StarRating from './StarRating';
import { TrekRatingStats } from '@/lib/types/rating-types';

interface RatingSummaryProps {
  trekId?: string;
  trekSlug?: string;
  initialStats?: TrekRatingStats;
  showDetailed?: boolean;
  className?: string;
}

export default function RatingSummary({
  trekId,
  trekSlug,
  initialStats,
  showDetailed = true,
  className = ''
}: RatingSummaryProps) {
  const [stats, setStats] = useState<TrekRatingStats | null>(initialStats || null);
  const [loading, setLoading] = useState(!initialStats);

  useEffect(() => {
    if (!initialStats && (trekId || trekSlug)) {
      fetchStats();
    }
  }, [trekId, trekSlug]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (trekId) params.append('trek_id', trekId);
      if (trekSlug) params.append('trek_slug', trekSlug);

      const response = await fetch(`/api/ratings/stats?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      } else {
        console.error('Error fetching rating stats:', data.error);
      }
    } catch (error) {
      console.error('Error fetching rating stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-card rounded-lg border p-6 animate-pulse ${className}`}>
        <div className="space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats || stats.total_ratings === 0) {
    return (
      <div className={`bg-card rounded-lg border p-6 text-center ${className}`}>
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Star className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No ratings yet</h3>
        <p className="text-muted-foreground">
          Be the first to rate this trek!
        </p>
      </div>
    );
  }

  const ratingDistribution = [
    { stars: 5, count: stats.five_star_count },
    { stars: 4, count: stats.four_star_count },
    { stars: 3, count: stats.three_star_count },
    { stars: 2, count: stats.two_star_count },
    { stars: 1, count: stats.one_star_count }
  ];

  return (
    <div className={`bg-card rounded-lg border p-6 space-y-6 ${className}`}>
      {/* Overall Rating */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-4xl font-bold text-foreground">
            {stats.average_rating.toFixed(1)}
          </span>
          <div className="flex flex-col items-start">
            <StarRating rating={stats.average_rating} readonly size="md" />
            <span className="text-sm text-muted-foreground">
              {stats.total_ratings} review{stats.total_ratings !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        {stats.recommend_percentage > 0 && (
          <div className="flex items-center justify-center gap-1 text-sm text-green-600">
            <ThumbsUp className="w-4 h-4" />
            <span>{stats.recommend_percentage}% recommend this trek</span>
          </div>
        )}
      </div>

      {showDetailed && (
        <>
          {/* Rating Distribution */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground mb-3">Rating Distribution</h4>
            {ratingDistribution.map(({ stars, count }) => {
              const percentage = stats.total_ratings > 0 ? (count / stats.total_ratings) * 100 : 0;
              
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm text-muted-foreground">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Detailed Ratings */}
          {(stats.average_difficulty || stats.average_guide_rating || stats.average_value_rating || stats.average_organization_rating) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Detailed Ratings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.average_difficulty > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Difficulty</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={stats.average_difficulty} readonly size="sm" />
                      <span className="text-sm font-medium">
                        {stats.average_difficulty.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                
                {stats.average_guide_rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Guide Quality</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={stats.average_guide_rating} readonly size="sm" />
                      <span className="text-sm font-medium">
                        {stats.average_guide_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                
                {stats.average_value_rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Value for Money</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={stats.average_value_rating} readonly size="sm" />
                      <span className="text-sm font-medium">
                        {stats.average_value_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
                
                {stats.average_organization_rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Organization</span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={stats.average_organization_rating} readonly size="sm" />
                      <span className="text-sm font-medium">
                        {stats.average_organization_rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
