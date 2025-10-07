'use client';

import { useState, useEffect, useCallback } from 'react';

interface TrekSlot {
  id: string;
  trek_id: string;
  date: string;
  capacity: number;
  booked: number;
  price: number;
}

interface UpcomingTrek {
  id: string;
  name: string;
  slug: string;
  description: string;
  region: string;
  difficulty: string;
  duration: string;
  price: number;
  rating: number;
  image: string;
  status: boolean;
  featured: boolean;
  created_at: string;
  best_time: string;
  sections: {
    overview: {
      altitude: string;
      grade: string;
      best_time: string;
    };
  };
  slots: TrekSlot[];
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  hasFewSeats: boolean;
}

interface UseUpcomingTreksReturn {
  treks: UpcomingTrek[];
  loading: boolean;
  error: string | null;
  upcomingCount: number;
  refetch: () => void;
}

export function useUpcomingTreks(limit: number = 6): UseUpcomingTreksReturn {
  const [treks, setTreks] = useState<UpcomingTrek[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);

  const fetchUpcomingTreks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/treks/upcoming?limit=${limit}`, {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minutes cache
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setTreks(data.treks || []);
      setUpcomingCount(data.upcomingCount || 0);
    } catch (err) {
      console.error('Error fetching upcoming treks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming treks');
      // Set empty array on error to prevent component crashes
      setTreks([]);
      setUpcomingCount(0);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchUpcomingTreks();
  }, [fetchUpcomingTreks]);

  const refetch = useCallback(() => {
    fetchUpcomingTreks();
  }, [fetchUpcomingTreks]);

  return {
    treks,
    loading,
    error,
    upcomingCount,
    refetch
  };
}
