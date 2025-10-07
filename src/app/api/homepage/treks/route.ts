import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import trekData from '../../../../../data/treks.json';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface JsonTrek {
  id: string;
  slug: string;
  name: string;
  description: string;
  region: string;
  difficulty: string;
  duration: string;
  price: number;
  rating: number;
  image: string;
  status: boolean;
  created_at: string;
  sections: Record<string, unknown>;
  gallery: Record<string, unknown>[];
  slots: Record<string, unknown>[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');
    
    // Get dynamic data from database
    let query = supabase
      .from('treks')
      .select('*')
      .eq('status', true)
      .order('updated_at', { ascending: false });

    // If featured parameter is true, filter by featured treks
    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    const { data: dynamicData, error } = await query;

    if (error) {
      console.error('Error fetching treks:', error);
      return NextResponse.json({ error: 'Failed to fetch treks' }, { status: 500 });
    }

    // Combine with JSON data
    const jsonTreks = (trekData as unknown as { treks: JsonTrek[] }).treks;
    const combinedTreks = [];

    for (const dbTrek of dynamicData || []) {
      const jsonTrek = jsonTreks.find((t: JsonTrek) => t.slug === dbTrek.slug);
      if (jsonTrek) {
        combinedTreks.push({
          ...jsonTrek,
          price: dbTrek.price || jsonTrek.price,
          image: dbTrek.image || jsonTrek.image,
          rating: dbTrek.rating || jsonTrek.rating,
          status: dbTrek.status,
          featured: dbTrek.featured,
          created_at: dbTrek.updated_at || dbTrek.created_at
        });
      }
    }

    return NextResponse.json({ treks: combinedTreks });
  } catch (error) {
    console.error('Error in treks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 