'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

interface Trek {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  price: number;
  image: string;
  location: string;
  rating?: number;
  reviews?: number;
}

interface TrekLeader {
  id: string;
  name: string;
  bio: string;
  experience_years: number;
  photo: string;
  created_at: string;
}

interface GalleryPhoto {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  date: string;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  image: string;
  slug: string;
  category?: string;
  read_time?: string;
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  website: string;
  description: string;
}

interface HomepageData {
  treks: Trek[];
  trekLeaders: TrekLeader[];
  galleryPhotos: GalleryPhoto[];
  blogPosts: BlogPost[];
  partners: Partner[];
}

interface UseOptimizedHomepageDataReturn {
  data: HomepageData;
  loading: boolean;
  error: string | null;
  isInitialLoad: boolean;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Optimized fetch with caching and error handling
const fetchWithCache = async (url: string): Promise<any> => {
  const now = Date.now();
  const cached = cache.get(url);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes browser cache
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP ${response.status} error for ${url}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    cache.set(url, { data, timestamp: now });
    return data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    // Return cached data if available, even if expired
    if (cached) {
      console.log(`Using cached data for ${url} due to error`);
      return cached.data;
    }
    
    // Return empty data structure instead of throwing
    console.log(`Returning empty data structure for ${url} due to error`);
    return getEmptyDataForEndpoint(url);
  }
};

// Helper function to return appropriate empty data structure based on endpoint
const getEmptyDataForEndpoint = (url: string) => {
  if (url.includes('/treks')) return { treks: [] };
  if (url.includes('/trek-leaders')) return { trekLeaders: [] };
  if (url.includes('/gallery')) return { galleryPhotos: [] };
  if (url.includes('/blog-posts')) return { blogPosts: [] };
  if (url.includes('/partners')) return { partners: [] };
  return {};
};

export function useOptimizedHomepageData(): UseOptimizedHomepageDataReturn {
  const [data, setData] = useState<HomepageData>({
    treks: [],
    trekLeaders: [],
    galleryPhotos: [],
    blogPosts: [],
    partners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoize API endpoints to prevent unnecessary re-renders
  const apiEndpoints = useMemo(() => [
    '/api/homepage/treks',
    '/api/homepage/trek-leaders',
    '/api/homepage/gallery',
    '/api/homepage/blog-posts',
    '/api/homepage/partners'
  ], []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data with optimized caching
      const responses = await Promise.allSettled(
        apiEndpoints.map(endpoint => fetchWithCache(endpoint))
      );

      const newData: HomepageData = {
        treks: [],
        trekLeaders: [],
        galleryPhotos: [],
        blogPosts: [],
        partners: []
      };

      let hasErrors = false;
      const errorMessages: string[] = [];

      // Process responses with error handling for individual endpoints
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const responseData = result.value;
          switch (index) {
            case 0:
              newData.treks = responseData.treks || [];
              break;
            case 1:
              newData.trekLeaders = responseData.trekLeaders || [];
              break;
            case 2:
              newData.galleryPhotos = responseData.galleryPhotos || [];
              break;
            case 3:
              newData.blogPosts = responseData.blogPosts || [];
              break;
            case 4:
              newData.partners = responseData.partners || [];
              break;
          }
        } else {
          hasErrors = true;
          const endpointName = apiEndpoints[index].split('/').pop() || 'unknown';
          errorMessages.push(`${endpointName}: ${result.reason?.message || 'Unknown error'}`);
          console.error(`Failed to fetch ${apiEndpoints[index]}:`, result.reason);
        }
      });

      // Set error message if there were any failures
      if (hasErrors) {
        setError(`Some data failed to load: ${errorMessages.join(', ')}`);
      }

      // Use requestAnimationFrame to prevent layout thrashing
      requestAnimationFrame(() => {
        setData(newData);
        setIsInitialLoad(false);
      });

    } catch (err) {
      console.error('Error fetching homepage data:', err);
      setError('Failed to load homepage data. Please check your connection and try again.');
    } finally {
      // Delay loading state change to prevent flash
      setTimeout(() => {
        setLoading(false);
      }, 100);
    }
  }, [apiEndpoints]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    loading,
    error,
    isInitialLoad
  }), [data, loading, error, isInitialLoad]);
}
