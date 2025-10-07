'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar } from 'lucide-react';

interface Rating {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  auth_user: {
    id: string;
    email: string;
  };
}

interface TrekRatingsProps {
  trekId: string;
  trekName: string;
}

const StarDisplay = ({ rating }: { rating: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'text-yellow-400 fill-current'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
};

const RatingCard = ({ rating }: { rating: Rating }) => {
  const userInitials = rating.auth_user.email
    .split('@')[0]
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {userInitials}
        </div>

        <div className="flex-1">
          {/* Rating Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StarDisplay rating={rating.rating} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {rating.rating} star{rating.rating !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              {new Date(rating.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* User Email (masked) */}
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <User className="w-3 h-3" />
            {rating.auth_user.email.replace(/(.{2}).*@/, '$1***@')}
          </div>

          {/* Review Text */}
          {rating.review && (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              "{rating.review}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default function TrekRatings({ trekId, trekName }: TrekRatingsProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    fetchRatings();
  }, [trekId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ratings?trek_id=${trekId}&limit=20`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ratings');
      }

      setRatings(data.ratings || []);
      setTotalRatings(data.total || 0);

      // Calculate average rating
      if (data.ratings && data.ratings.length > 0) {
        const avg = data.ratings.reduce((sum: number, r: Rating) => sum + r.rating, 0) / data.ratings.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }

    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Unable to Load Ratings
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={fetchRatings}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Trek Reviews & Ratings
        </h2>
        
        {totalRatings > 0 ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <StarDisplay rating={Math.floor(averageRating)} />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {averageRating}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No ratings yet. Be the first to rate this trek!
          </p>
        )}
      </div>

      {/* Ratings List */}
      {ratings.length > 0 ? (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <RatingCard key={rating.id} rating={rating} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            This trek hasn't been reviewed yet. Complete this trek to be the first to share your experience!
          </p>
        </div>
      )}

      {/* Call to Action */}
      {totalRatings > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Have you completed this trek? 
            <a 
              href="/dashboard/ratings" 
              className="text-blue-600 hover:text-blue-700 font-medium ml-1"
            >
              Share your experience
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
