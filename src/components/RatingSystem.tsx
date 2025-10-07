'use client';

import { useState, useEffect } from 'react';
import { Star, MessageSquare, Calendar, MapPin, Clock, Send, CheckCircle, Plus } from 'lucide-react';
import Image from 'next/image';
import RatingsList from './RatingsList';
import { useAuth } from '@/hooks/context/AuthContext';
import { CreateRatingRequest } from '@/lib/types/rating-types';

interface EligibleTrek {
  booking_id: string;
  trek_id: string;
  trek_slug: string;
  trek_name: string;
  trek_image: string;
  trek_region: string;
  trek_difficulty: string;
  trek_duration: string;
  completed_date: string;
  can_rate: boolean;
}

interface Rating {
  id: string;
  rating: number;
  review: string;
  created_at: string;
  updated_at: string;
  auth_user: {
    id: string;
    email: string;
  };
  treks: {
    id: string;
    slug: string;
    name: string;
  };
}

const StarRating = ({ 
  rating, 
  onRatingChange, 
  readonly = false 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean;
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`w-6 h-6 transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          onClick={() => !readonly && onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          <Star
            className={`w-full h-full ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const RatingForm = ({ 
  trek, 
  onSubmit, 
  isSubmitting 
}: { 
  trek: EligibleTrek; 
  onSubmit: (rating: number, review: string) => void;
  isSubmitting: boolean;
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating > 0) {
      onSubmit(rating, review);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Trek Header */}
      <div className="relative h-48">
        <Image
          src={trek.trek_image || '/images/placeholder-trek.jpg'}
          alt={trek.trek_name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 text-white">
          <h3 className="text-xl font-bold mb-1">{trek.trek_name}</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {trek.trek_region}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {trek.trek_duration}
            </span>
          </div>
        </div>
      </div>

      {/* Rating Form */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Completed on {new Date(trek.completed_date).toLocaleDateString()}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              How would you rate this trek?
            </label>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} onRatingChange={setRating} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : 'Select rating'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Share your experience (optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell others about your trek experience..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {review.length}/500 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={rating === 0 || isSubmitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Rating
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default function RatingSystem() {
  const { user } = useAuth();
  const [eligibleTreks, setEligibleTreks] = useState<EligibleTrek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingTrek, setSubmittingTrek] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchEligibleTreks();
  }, []);

  const fetchEligibleTreks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/ratings/eligible');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch eligible treks');
      }

      setEligibleTreks(data.eligibleTreks || []);
    } catch (err) {
      console.error('Error fetching eligible treks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load eligible treks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRating = async (trek: EligibleTrek, rating: number, review: string) => {
    try {
      setSubmittingTrek(trek.booking_id);
      setError(null);

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trek_id: trek.trek_id,
          booking_id: trek.booking_id,
          rating,
          review
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit rating');
      }

      // Remove the rated trek from the list
      setEligibleTreks(prev => prev.filter(t => t.booking_id !== trek.booking_id));
      setSuccessMessage(`Thank you for rating ${trek.trek_name}!`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
    } finally {
      setSubmittingTrek(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading your completed treks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Rate Your Treks
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Share your experience and help other trekkers choose their next adventure
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Eligible Treks */}
      {eligibleTreks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eligibleTreks.map((trek) => (
            <RatingForm
              key={trek.booking_id}
              trek={trek}
              onSubmit={(rating, review) => handleSubmitRating(trek, rating, review)}
              isSubmitting={submittingTrek === trek.booking_id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Treks to Rate
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Complete a trek to share your experience and help other adventurers!
          </p>
          <a
            href="/treks"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Treks
          </a>
        </div>
      )}

      {/* User's Existing Ratings */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Star className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Your Reviews
          </h2>
        </div>
        <RatingsList 
          userId={user?.id}
          showTrekName={true}
          limit={20}
        />
      </div>
    </div>
  );
}
