'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/context/AuthContext';

export interface WishlistItem {
  id: string;
  trek_id: string;
  trek_slug: string;
  trek_name: string;
  created_at: string;
}

export function useWishlist() {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load wishlist items
  const loadWishlist = async () => {
    if (!user) {
      setWishlistItems([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 Loading wishlist from API...');
      const response = await fetch('/api/dashboard/wishlist');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wishlist API response:', data);
        console.log('📋 Setting wishlist items:', data.wishlist?.length || 0, 'items');
        setWishlistItems(data.wishlist || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Wishlist API error:', errorData);
        setError(errorData.error || 'Failed to load wishlist');
      }
    } catch (err) {
      setError('Error loading wishlist');
      console.error('❌ Wishlist load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add item to wishlist
  const addToWishlist = async (trekSlug: string) => {
    if (!user) {
      setError('Please login to add items to wishlist');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trek_slug: trekSlug }),
      });

      if (response.ok) {
        // Reload wishlist to get updated data
        await loadWishlist();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add to wishlist');
        return false;
      }
    } catch (err) {
      setError('Error adding to wishlist');
      console.error('Add to wishlist error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (trekSlug: string) => {
    if (!user) {
      setError('Please login to manage wishlist');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/wishlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trek_slug: trekSlug }),
      });

      if (response.ok) {
        // Remove item from local state immediately for better UX
        setWishlistItems(prev => prev.filter(item => item.trek_slug !== trekSlug));
        // Also reload wishlist to ensure consistency
        await loadWishlist();
        return true;
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to remove from wishlist');
        return false;
      }
    } catch (err) {
      setError('Error removing from wishlist');
      console.error('Remove from wishlist error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (trekSlug: string) => {
    const found = wishlistItems.some(item => item.trek_slug === trekSlug);
    console.log(`🔍 Checking if ${trekSlug} is in wishlist:`, found);
    console.log('📋 Current wishlist items:', wishlistItems.map(item => ({ id: item.id, slug: item.trek_slug, name: item.trek_name })));
    return found;
  };

  // Toggle wishlist status
  const toggleWishlist = async (trekSlug: string) => {
    if (isInWishlist(trekSlug)) {
      return await removeFromWishlist(trekSlug);
    } else {
      return await addToWishlist(trekSlug);
    }
  };

  // Load wishlist when user changes
  useEffect(() => {
    loadWishlist();
  }, [user]);

  return {
    wishlistItems,
    loading,
    error,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    loadWishlist,
  };
}
