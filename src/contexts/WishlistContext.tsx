'use client';

import React, { createContext, useContext } from 'react';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistContextType {
  wishlistItems: any[];
  loading: boolean;
  error: string | null;
  addToWishlist: (trekSlug: string) => Promise<boolean>;
  removeFromWishlist: (trekSlug: string) => Promise<boolean>;
  isInWishlist: (trekSlug: string) => boolean;
  toggleWishlist: (trekSlug: string) => Promise<boolean>;
  loadWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const wishlistData = useWishlist();

  return (
    <WishlistContext.Provider value={wishlistData}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
}
