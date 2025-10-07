'use client';

import { useState, useEffect, useCallback } from 'react';

interface PopularTrek {
  id: string;
  name: string;
  region: string;
  difficulty: string;
  duration: string;
  maxAltitude: string;
  bestTime: string;
  image: string;
  description: string;
  highlights: string[];
  slug: string;
  featured: boolean;
  rating: number;
  price: number;
}

interface UsePopularTreksReturn {
  treks: PopularTrek[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePopularTreks(limit: number = 6): UsePopularTreksReturn {
  const [treks, setTreks] = useState<PopularTrek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPopularTreks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/treks/popular?limit=${limit}`, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setTreks(data.popularTreks || []);
    } catch (err) {
      console.error('Error fetching popular treks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch popular treks');
      // Set empty array on error to prevent component crashes
      setTreks([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPopularTreks();
  }, [fetchPopularTreks]);

  const refetch = useCallback(() => {
    fetchPopularTreks();
  }, [fetchPopularTreks]);

  return {
    treks,
    loading,
    error,
    refetch
  };
}
