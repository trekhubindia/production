'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
  showValue = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    if (!readonly) {
      setHoverRating(starRating);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isPartiallyFilled = star - 0.5 <= displayRating && displayRating < star;
          
          return (
            <button
              key={star}
              type="button"
              className={`
                relative transition-colors duration-150
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                ${!readonly ? 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded' : ''}
              `}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              disabled={readonly}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              <Star
                className={`
                  ${sizeClasses[size]} transition-colors duration-150
                  ${isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : isPartiallyFilled
                    ? 'fill-yellow-200 text-yellow-400'
                    : 'fill-transparent text-gray-300 dark:text-gray-600'
                  }
                  ${!readonly && hoverRating >= star ? 'fill-yellow-400 text-yellow-400' : ''}
                `}
              />
              {/* Partial fill for half stars */}
              {isPartiallyFilled && (
                <Star
                  className={`
                    ${sizeClasses[size]} absolute inset-0 transition-colors duration-150
                    fill-yellow-400 text-yellow-400
                  `}
                  style={{
                    clipPath: 'inset(0 50% 0 0)'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="text-sm text-muted-foreground ml-2">
          {rating.toFixed(1)}
        </span>
      )}
      
      {!readonly && hoverRating > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          {hoverRating} star{hoverRating !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// Compact star rating for cards and lists
export function CompactStarRating({ 
  rating, 
  totalRatings, 
  size = 'sm',
  className = '' 
}: { 
  rating: number; 
  totalRatings?: number; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <StarRating rating={rating} readonly size={size} />
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)}
        {totalRatings !== undefined && (
          <span className="ml-1">({totalRatings})</span>
        )}
      </span>
    </div>
  );
}
