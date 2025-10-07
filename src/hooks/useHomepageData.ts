'use client';

import { useState, useEffect } from 'react';

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
  // Optional fields used by UI components like BlogHighlightsSection
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

interface UseHomepageDataReturn {
  data: HomepageData;
  loading: boolean;
  error: string | null;
}

export function useHomepageData(): UseHomepageDataReturn {
  const [data, setData] = useState<HomepageData>({
    treks: [],
    trekLeaders: [],
    galleryPhotos: [],
    blogPosts: [],
    partners: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          treksResponse,
          trekLeadersResponse,
          galleryResponse,
          blogPostsResponse,
          partnersResponse
        ] = await Promise.all([
          fetch('/api/homepage/treks'),
          fetch('/api/homepage/trek-leaders'),
          fetch('/api/homepage/gallery'),
          fetch('/api/homepage/blog-posts'),
          fetch('/api/homepage/partners')
        ]);

        const [
          treksData,
          trekLeadersData,
          galleryData,
          blogPostsData,
          partnersData
        ] = await Promise.all([
          treksResponse.json(),
          trekLeadersResponse.json(),
          galleryResponse.json(),
          blogPostsResponse.json(),
          partnersResponse.json()
        ]);

        setData({
          treks: treksData.treks || [],
          trekLeaders: trekLeadersData.trekLeaders || [],
          galleryPhotos: galleryData.galleryPhotos || [],
          blogPosts: blogPostsData.blogPosts || [],
          partners: partnersData.partners || []
        });
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError('Failed to load homepage data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
} 