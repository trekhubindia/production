'use client';

import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, Calendar, MessageSquare } from 'lucide-react';
import StarRating from './StarRating';
import { CreateRatingRequest, RATING_CATEGORIES } from '@/lib/types/rating-types';

interface RatingFormProps {
  trekId: string;
  trekName: string;
  bookingId?: string;
  existingRating?: any;
  onSubmit: (rating: CreateRatingRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RatingForm({
  trekId,
  trekName,
  bookingId,
  existingRating,
  onSubmit,
  onCancel,
  isLoading = false
}: RatingFormProps) {
  const [formData, setFormData] = useState({
    rating: existingRating?.rating || 0,
    review: existingRating?.review || '',
    difficulty_rating: existingRating?.difficulty_rating || 0,
    guide_rating: existingRating?.guide_rating || 0,
    value_rating: existingRating?.value_rating || 0,
    organization_rating: existingRating?.organization_rating || 0,
    would_recommend: existingRating?.would_recommend ?? true,
    trek_date: existingRating?.trek_date || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.rating === 0) {
      newErrors.rating = 'Overall rating is required';
    }

    if (formData.review.trim().length < 10) {
      newErrors.review = 'Review must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({
        trek_id: trekId,
        booking_id: bookingId,
        ...formData
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const updateRating = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Rate Your Experience
        </h3>
        <p className="text-muted-foreground">
          Share your experience with <strong>{trekName}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Overall Rating *
          </label>
          <div className="flex items-center gap-4">
            <StarRating
              rating={formData.rating}
              onRatingChange={(rating) => updateRating('rating', rating)}
              size="lg"
            />
            <span className="text-sm text-muted-foreground">
              {formData.rating > 0 && (
                <>
                  {formData.rating} star{formData.rating !== 1 ? 's' : ''}
                </>
              )}
            </span>
          </div>
          {errors.rating && (
            <p className="text-sm text-red-600 dark:text-red-400">{errors.rating}</p>
          )}
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Difficulty Level
            </label>
            <StarRating
              rating={formData.difficulty_rating}
              onRatingChange={(rating) => updateRating('difficulty_rating', rating)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Guide Quality
            </label>
            <StarRating
              rating={formData.guide_rating}
              onRatingChange={(rating) => updateRating('guide_rating', rating)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Value for Money
            </label>
            <StarRating
              rating={formData.value_rating}
              onRatingChange={(rating) => updateRating('value_rating', rating)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Organization
            </label>
            <StarRating
              rating={formData.organization_rating}
              onRatingChange={(rating) => updateRating('organization_rating', rating)}
            />
          </div>
        </div>

        {/* Trek Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Trek Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={formData.trek_date}
              onChange={(e) => setFormData(prev => ({ ...prev, trek_date: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {/* Review */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Your Review *
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              value={formData.review}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, review: e.target.value }));
                if (errors.review) {
                  setErrors(prev => ({ ...prev, review: '' }));
                }
              }}
              placeholder="Share your experience, what you loved, and any tips for future trekkers..."
              rows={4}
              className="w-full pl-10 pr-4 py-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-between items-center">
            {errors.review && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.review}</p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">
              {formData.review.length}/500 characters
            </p>
          </div>
        </div>

        {/* Recommendation */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            Would you recommend this trek?
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, would_recommend: true }))}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${formData.would_recommend 
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                  : 'bg-background border-input text-muted-foreground hover:bg-muted'
                }
              `}
            >
              <ThumbsUp className="w-4 h-4" />
              Yes, I recommend it
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, would_recommend: false }))}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors
                ${!formData.would_recommend 
                  ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' 
                  : 'bg-background border-input text-muted-foreground hover:bg-muted'
                }
              `}
            >
              <ThumbsDown className="w-4 h-4" />
              No, I don't recommend it
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary text-primary-foreground py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-input rounded-lg font-semibold text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
