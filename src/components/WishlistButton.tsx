'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistContext } from '@/contexts/WishlistContext';
import { useAuth } from '@/hooks/context/AuthContext';

interface WishlistButtonProps {
  trekSlug: string;
  trekName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button';
  showLabel?: boolean;
}

export default function WishlistButton({
  trekSlug,
  trekName,
  className = '',
  size = 'md',
  variant = 'icon',
  showLabel = false
}: WishlistButtonProps) {
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist, loading } = useWishlistContext();
  const [isToggling, setIsToggling] = useState(false);

  const isWishlisted = isInWishlist(trekSlug);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if button is inside a link
    e.stopPropagation(); // Prevent event bubbling

    console.log('🔄 Wishlist button clicked for:', trekSlug);
    console.log('👤 User:', user ? 'Logged in' : 'Not logged in');
    console.log('❤️ Currently wishlisted:', isWishlisted);

    if (!user) {
      // You could show a login modal here
      alert('Please login to add items to your wishlist');
      return;
    }

    if (isToggling || loading) {
      console.log('⏳ Already processing or loading, skipping...');
      return;
    }

    setIsToggling(true);
    try {
      console.log('🚀 Calling toggleWishlist...');
      const result = await toggleWishlist(trekSlug);
      console.log('✅ Toggle result:', result);
      console.log('❤️ New wishlist status:', isInWishlist(trekSlug));
    } catch (error) {
      console.error('❌ Error toggling wishlist:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      icon: 'w-4 h-4',
      button: 'px-2 py-1 text-xs',
      container: 'p-1'
    },
    md: {
      icon: 'w-5 h-5',
      button: 'px-3 py-2 text-sm',
      container: 'p-2'
    },
    lg: {
      icon: 'w-6 h-6',
      button: 'px-4 py-2 text-base',
      container: 'p-3'
    }
  };

  const config = sizeConfig[size];

  if (variant === 'button') {
    return (
      <button
        onClick={handleToggle}
        disabled={isToggling || loading}
        className={`
          inline-flex items-center gap-2 rounded-lg font-medium transition-all duration-200
          ${config.button}
          ${isWishlisted 
            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30' 
            : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
          ${isToggling || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
          ${className}
        `}
        title={isWishlisted ? `Remove ${trekName || 'trek'} from wishlist` : `Add ${trekName || 'trek'} to wishlist`}
      >
        <Heart 
          className={`${config.icon} transition-all duration-200 ${
            isWishlisted ? 'fill-current text-red-500 dark:text-red-400' : ''
          }`} 
        />
        {showLabel && (
          <span>
            {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </span>
        )}
      </button>
    );
  }

  // Icon variant (default)
  return (
    <button
      onClick={handleToggle}
      disabled={isToggling || loading}
      className={`
        inline-flex items-center justify-center rounded-full transition-all duration-200
        ${config.container}
        ${isWishlisted 
          ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' 
          : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm'
        }
        ${isToggling || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:scale-105'}
        ${className}
      `}
      title={isWishlisted ? `Remove ${trekName || 'trek'} from wishlist` : `Add ${trekName || 'trek'} to wishlist`}
    >
      <Heart 
        className={`${config.icon} transition-all duration-200 ${
          isWishlisted ? 'fill-current text-red-500 dark:text-red-400' : ''
        }`} 
      />
    </button>
  );
}
