import trekData from '../../data/treks.json';
import { createClient } from '@supabase/supabase-js';

export interface Trek {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: string;
  difficulty: string;
  duration: string;
  created_at: string;
  cancellationPolicy?: string;
  // Dynamic fields fetched from database only
  price?: number;
  rating?: number;
  image?: string;
  status?: boolean;
  featured?: boolean;
  // Fields can be either in sections or at root level
  sections?: {
    overview?: {
      description?: string;
      highlights?: string[];
      trekName?: string;
      days?: string;
      adventureType?: string;
      baseCamp?: string;
      season?: string;
      month?: string;
      country?: string;
      altitude?: string;
      grade?: string;
      railHead?: string;
      stay?: string;
      food?: string;
      location?: string;
      distance?: string;
      trailType?: string;
      airport?: string;
    };
    whoCanParticipate?: string;
    howToReach?: string;
    costTerms?: {
      inclusions: string[];
      exclusions: string[];
    };
    itinerary?: Array<{
      day_number: number;
      title?: string;
      altitude?: string;
      distance?: string;
      description: string;
    }>;
    trekEssentials?: {
      clothing: string[];
      footwear: string[];
      accessories: string[];
      documents: string[];
    };
  };
  // Root level fields (for treks updated by our script)
  whoCanParticipate?: string;
  howToReach?: string;
  costTerms?: {
    inclusions: string[];
    exclusions: string[];
  };
  itinerary?: Array<{
    day_number?: number;
    day?: number;
    title?: string;
    altitude?: string;
    distance?: string;
    description?: string;
  }>;
  trekEssentials?: {
    clothing: string[];
    footwear: string[];
    accessories: string[];
    documents: string[];
  };
  gallery: Array<{
    id: string;
    url: string;
    alt: string;
    caption?: string;
    is_featured?: boolean;
  }>;
  slots: Array<{
    id: string;
    date: string;
    capacity: number;
    booked: number;
    status: string;
  }>;
}

export interface TrekList {
  treks: Trek[];
}

export interface TrekDynamicData {
  trek_slug: string;
  featured?: boolean;
  rating?: number;
  price?: number;
  status?: boolean;
  image?: string;
  updated_at?: string;
}

export interface TrekSlot {
  date: string;
  capacity: number;
  booked?: number;
  status?: 'open' | 'full' | 'closed';
}

// Create Supabase client
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
};

// Create Supabase admin client for admin operations
const createSupabaseAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase admin environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get dynamic data from database (price, visibility, slots, featured, gallery)
// This function is now deprecated since trek_dynamic_data has been merged into treks table
async function getDynamicData(slug: string) {
  try {
    const supabase = createSupabaseClient();
    
    // Get trek data from the treks table (now contains merged data)
    const { data: trekData, error: trekError } = await supabase
      .from('treks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (trekError && trekError.code !== 'PGRST116') {
      console.error('Error fetching trek data:', trekError);
      return null;
    }

    // If no trek data found, return null
    if (!trekData) {
      return null;
    }

    // Get trek slots
    const { data: slots, error: slotsError } = await supabase
      .from('trek_slots')
      .select('*')
      .eq('trek_slug', slug)
      .order('date');

    if (slotsError) {
      console.error('Error fetching slots:', slotsError);
      return { ...trekData, slots: [] };
    }

    // Get trek gallery images
    const { data: galleryImages, error: galleryError } = await supabase
      .from('trek_images')
      .select('*')
      .eq('trek_id', trekData.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (galleryError) {
      console.error('Error fetching gallery images:', galleryError);
      return { ...trekData, slots: slots || [], gallery: [] };
    }

    // Transform gallery images to match the expected format
    const gallery = galleryImages?.map(img => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text,
      caption: img.caption,
      is_featured: img.is_featured
    })) || [];

    return {
      ...trekData,
      slots: slots || [],
      gallery: gallery
    };
  } catch (error) {
    console.error('Error in getDynamicData:', error);
    return null;
  }
}

// Get featured treks (JSON + database dynamic data)
export async function getFeaturedTreks(): Promise<Trek[]> {
  try {
    const supabase = createSupabaseClient();
    
    // Get featured treks from the new treks table
    const { data: featuredTreksData, error } = await supabase
      .from('treks')
      .select('*')
      .eq('featured', true)
      .eq('status', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured treks:', error);
      return [];
    }

    // Combine with JSON data
    const featuredTreks: Trek[] = [];
    const jsonTreks = (trekData as TrekList).treks;

    for (const trekData of featuredTreksData || []) {
      const jsonTrek = jsonTreks.find(t => t.slug === trekData.slug);
      if (jsonTrek) {
        // Get gallery images for this trek
        const { data: galleryImages } = await supabase
          .from('trek_images')
          .select('*')
          .eq('trek_id', trekData.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        const gallery = galleryImages?.map(img => ({
          id: img.id,
          url: img.image_url,
          alt: img.alt_text,
          caption: img.caption,
          is_featured: img.is_featured
        })) || [];

        featuredTreks.push({
          ...jsonTrek,
          // Dynamic fields from database only
          price: trekData.price,
          rating: trekData.rating,
          image: trekData.image,
          status: trekData.status,
          featured: trekData.featured,
          slots: trekData.slots || [],
          gallery: gallery
        });
      }
    }

    return featuredTreks;
  } catch (error) {
    console.error('Error in getFeaturedTreks:', error);
    return [];
  }
}

// Get all treks (JSON + database dynamic data)
export async function getAllTreks(): Promise<Trek[]> {
  try {
    const supabase = createSupabaseClient();
    
    // Get all treks from the new treks table
    const { data: dbTreks, error } = await supabase
      .from('treks')
      .select('*')
      .eq('status', true)
      .order('name');

    if (error) {
      console.error('Error fetching treks from database:', error);
      // Fallback to JSON data only
      return (trekData as TrekList).treks;
    }

    const jsonTreks = (trekData as TrekList).treks;
    const treksWithDynamicData: Trek[] = [];

    for (const dbTrek of dbTreks || []) {
      const jsonTrek = jsonTreks.find(t => t.slug === dbTrek.slug);
      if (jsonTrek) {
        // Get slots for this trek
        const { data: slots } = await supabase
          .from('trek_slots')
          .select('*')
          .eq('trek_slug', dbTrek.slug)
          .order('date');

        // Get gallery images for this trek
        const { data: galleryImages } = await supabase
          .from('trek_images')
          .select('*')
          .eq('trek_id', dbTrek.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        const gallery = galleryImages?.map(img => ({
          id: img.id,
          url: img.image_url,
          alt: img.alt_text,
          caption: img.caption,
          is_featured: img.is_featured
        })) || [];

        treksWithDynamicData.push({
          ...jsonTrek,
          // Dynamic fields from database only
          price: dbTrek.price,
          rating: dbTrek.rating,
          image: dbTrek.image,
          status: dbTrek.status,
          featured: dbTrek.featured,
          slots: slots || [],
          gallery: gallery
        });
      }
    }

    return treksWithDynamicData;
  } catch (error) {
    console.error('Error in getAllTreks:', error);
    // Fallback to JSON data only
    return (trekData as TrekList).treks;
  }
}

// Get trek by slug (JSON + database dynamic data)
export async function getTrekBySlug(slug: string): Promise<Trek | null> {
  try {
    const supabase = createSupabaseClient();
    
    // Get trek from the treks table (contains merged data from trek_dynamic_data)
    const { data: dbTrek, error } = await supabase
      .from('treks')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching trek from database:', error);
      // Fallback to JSON data only
      const jsonTreks = (trekData as TrekList).treks;
      return jsonTreks.find(t => t.slug === slug) || null;
    }

    if (!dbTrek) {
      // Fallback to JSON data only
      const jsonTreks = (trekData as TrekList).treks;
      return jsonTreks.find(t => t.slug === slug) || null;
    }

    const jsonTreks = (trekData as TrekList).treks;
    const jsonTrek = jsonTreks.find(t => t.slug === slug);
    
    if (!jsonTrek) return null;

    // Get slots for this trek
    const { data: slots } = await supabase
      .from('trek_slots')
      .select('*')
      .eq('trek_slug', slug)
      .order('date');

    // Get gallery images for this trek
    const { data: galleryImages } = await supabase
      .from('trek_images')
      .select('*')
      .eq('trek_id', dbTrek.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    const gallery = galleryImages?.map(img => ({
      id: img.id,
      url: img.image_url,
      alt: img.alt_text,
      caption: img.caption,
      is_featured: img.is_featured
    })) || [];

    // Combine JSON data (static content) with database data (dynamic content)
    return {
      ...jsonTrek, // Static content: name, description, itinerary, sections, etc.
      // Dynamic fields from database only
      price: dbTrek.price,
      rating: dbTrek.rating,
      image: dbTrek.image,
      status: dbTrek.status,
      featured: dbTrek.featured,
      slots: slots || [], // Dynamic: available slots
      gallery: gallery // Dynamic: gallery images
    };
  } catch (error) {
    console.error('Error in getTrekBySlug:', error);
    // Fallback to JSON data only
    const jsonTreks = (trekData as TrekList).treks;
    return jsonTreks.find(t => t.slug === slug) || null;
  }
}

// Get treks by region
export async function getTreksByRegion(region: string): Promise<Trek[]> {
  const allTreks = await getAllTreks();
  return allTreks.filter(trek => trek.region === region);
}

// Get treks by difficulty
export async function getTreksByDifficulty(difficulty: string): Promise<Trek[]> {
  const allTreks = await getAllTreks();
  return allTreks.filter(trek => trek.difficulty === difficulty);
}

// Search treks
export async function searchTreks(searchTerm: string): Promise<Trek[]> {
  const allTreks = await getAllTreks();
  const term = searchTerm.toLowerCase();
  
  return allTreks.filter(trek => 
    trek.name.toLowerCase().includes(term) ||
    trek.description.toLowerCase().includes(term) ||
    trek.region.toLowerCase().includes(term)
  );
}

// Get all regions
export function getAllRegions(): string[] {
  const regions = new Set(trekData.treks.map(trek => trek.region));
  return Array.from(regions).sort();
}

// Get all difficulties
export function getAllDifficulties(): string[] {
  const difficulties = new Set(trekData.treks.map(trek => trek.difficulty));
  return Array.from(difficulties).sort();
}

// Get trek slots
export async function getTrekSlots(slug: string) {
  const dynamicData = await getDynamicData(slug);
  return dynamicData?.slots || [];
}

// Get static paths for SSG
export function getStaticPaths() {
  return trekData.treks.map(trek => ({
    params: { slug: trek.slug }
  }));
}

// Update trek data (admin function)
export async function updateTrekData(slug: string, updates: Partial<TrekDynamicData>) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('treks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select();

    if (error) {
      console.error('Error updating trek data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTrekData:', error);
    throw error;
  }
}

// Update trek dynamic data (admin function)
export const updateTrekDynamicData = async (slug: string, updates: Partial<TrekDynamicData>) => {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('treks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('slug', slug)
      .select();

    if (error) {
      console.error('Error updating trek dynamic data:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateTrekDynamicData:', error);
    throw error;
  }
};

// Update trek slots (admin function)
export async function updateTrekSlots(slug: string, slots: TrekSlot[]) {
  try {
    const supabase = createSupabaseAdminClient();
    
    // Delete existing slots for this trek
    const { error: deleteError } = await supabase
      .from('trek_slots')
      .delete()
      .eq('trek_slug', slug);

    if (deleteError) {
      console.error('Error deleting existing slots:', deleteError);
      throw deleteError;
    }

    // Insert new slots
    if (slots.length > 0) {
      const slotsToInsert = slots.map(slot => ({
        trek_slug: slug,
        date: slot.date,
        capacity: slot.capacity,
        booked: slot.booked || 0,
        status: slot.status || 'open'
      }));

      const { data, error: insertError } = await supabase
        .from('trek_slots')
        .insert(slotsToInsert);

      if (insertError) {
        console.error('Error inserting slots:', insertError);
        throw insertError;
      }

      return data;
    }

    return [];
  } catch (error) {
    console.error('Error in updateTrekSlots:', error);
    throw error;
  }
}

// Toggle trek featured status (admin function)
export async function toggleTrekFeatured(slug: string, featured: boolean) {
  try {
    const supabase = createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('treks')
      .update({ featured })
      .eq('slug', slug)
      .select();

    if (error) {
      console.error('Error toggling trek featured status:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in toggleTrekFeatured:', error);
    throw error;
  }
} 