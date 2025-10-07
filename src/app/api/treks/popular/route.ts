import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import trekData from '../../../../data/treks.json';

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
  created_at: string;
  sections: {
    itinerary?: {
      days?: Array<{
        day: number;
        title: string;
        description: string;
        altitude?: string;
        distance?: string;
        duration?: string;
      }>;
    };
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const useTrending = searchParams.get('trending') !== 'false'; // Default to true
    
    let popularTreks;
    let error;
    
    if (useTrending) {
      // Get trending treks from today's data, fallback to database sorting
      const today = new Date().toISOString().split('T')[0];
      
      const { data: trendingData, error: trendingError } = await supabase
        .from('trending_treks')
        .select(`
          trek_slug,
          trending_score,
          treks!inner(*)
        `)
        .eq('date_calculated', today)
        .eq('treks.status', 'true')
        .not('treks.image', 'is', null)
        .neq('treks.image', '')
        .order('trending_score', { ascending: false })
        .limit(limit * 2); // Get more to account for filtering
      
      if (!trendingError && trendingData && trendingData.length > 0) {
        // Use trending data
        popularTreks = trendingData.map(item => ({
          ...item.treks,
          trending_score: item.trending_score
        })).slice(0, limit);
        
        console.log(`📈 Using trending data: ${popularTreks.length} treks found`);
      } else {
        console.log('📊 No trending data available, falling back to database sorting');
        // Fallback to traditional sorting
        const fallbackResult = await supabase
          .from('treks')
          .select('*')
          .eq('status', 'true')
          .not('image', 'is', null)
          .neq('image', '')
          .order('featured', { ascending: false })
          .order('rating', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit(limit);
        
        popularTreks = fallbackResult.data;
        error = fallbackResult.error;
      }
    } else {
      // Use traditional database sorting
      const result = await supabase
        .from('treks')
        .select('*')
        .eq('status', 'true')
        .not('image', 'is', null)
        .neq('image', '')
        .order('featured', { ascending: false }) // Featured treks first
        .order('rating', { ascending: false })   // Then by rating
        .order('updated_at', { ascending: false }) // Then by recent updates
        .limit(limit);
      
      popularTreks = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching popular treks:', error);
      return NextResponse.json({ error: 'Failed to fetch popular treks' }, { status: 500 });
    }

    // Combine with JSON data to get complete trek information
    const jsonTreks = (trekData as { treks: JsonTrek[] }).treks;
    const combinedTreks = [];

    for (const dbTrek of popularTreks || []) {
      const jsonTrek = jsonTreks.find((t: JsonTrek) => t.slug === dbTrek.slug);
      if (jsonTrek) {
        // Calculate max altitude from itinerary if available
        let maxAltitude = 'N/A';
        if (jsonTrek.sections?.itinerary?.days) {
          const altitudes = jsonTrek.sections.itinerary.days
            .map(day => day.altitude)
            .filter(Boolean)
            .map(alt => {
              const match = alt?.match(/(\d+,?\d*)\s*(?:ft|m)/i);
              return match ? parseInt(match[1].replace(',', '')) : 0;
            })
            .filter(alt => alt > 0);
          
          if (altitudes.length > 0) {
            const maxAlt = Math.max(...altitudes);
            maxAltitude = maxAlt > 1000 ? `${maxAlt.toLocaleString()} ft` : `${maxAlt} ft`;
          }
        }

        // Determine best time based on region and difficulty
        let bestTime = 'Year-round';
        const region = jsonTrek.region.toLowerCase();
        const difficulty = jsonTrek.difficulty.toLowerCase();
        
        if (region.includes('nepal') || region.includes('sikkim')) {
          bestTime = 'Mar-May, Sep-Nov';
        } else if (region.includes('ladakh') || region.includes('kashmir')) {
          bestTime = 'Jun-Sep';
        } else if (region.includes('uttarakhand') || region.includes('himachal')) {
          if (difficulty.includes('winter') || jsonTrek.name.toLowerCase().includes('winter')) {
            bestTime = 'Dec-Mar';
          } else if (jsonTrek.name.toLowerCase().includes('valley of flowers')) {
            bestTime = 'Jul-Sep';
          } else {
            bestTime = 'Apr-Jun, Sep-Nov';
          }
        }

        // Generate highlights based on trek characteristics
        const highlights = [];
        const name = jsonTrek.name.toLowerCase();
        const desc = jsonTrek.description.toLowerCase();
        
        if (name.includes('base camp') || desc.includes('base camp')) highlights.push('Base camp');
        if (name.includes('pass') || desc.includes('pass')) highlights.push('Pass crossing');
        if (name.includes('lake') || desc.includes('lake')) highlights.push('Alpine lake');
        if (name.includes('glacier') || desc.includes('glacier')) highlights.push('Glacier views');
        if (name.includes('peak') || desc.includes('summit')) highlights.push('Summit climb');
        if (desc.includes('flower') || name.includes('flower')) highlights.push('Alpine meadows');
        if (difficulty === 'easy') highlights.push('Beginner friendly');
        if (difficulty === 'difficult' || difficulty === 'expert') highlights.push('Technical climb');
        if (region.includes('nepal')) highlights.push('Cultural villages');
        if (name.includes('winter') || bestTime.includes('Dec')) highlights.push('Snow trekking');
        
        // Add default highlights if none found
        if (highlights.length === 0) {
          highlights.push('Scenic beauty', 'Mountain views', 'Adventure');
        }

        combinedTreks.push({
          id: dbTrek.id,
          name: jsonTrek.name,
          region: jsonTrek.region,
          difficulty: jsonTrek.difficulty,
          duration: jsonTrek.duration,
          maxAltitude,
          bestTime,
          image: dbTrek.image || '/images/placeholder-trek.jpg',
          description: jsonTrek.description,
          highlights: highlights.slice(0, 4), // Limit to 4 highlights
          slug: jsonTrek.slug,
          featured: dbTrek.featured,
          rating: dbTrek.rating || 0,
          price: dbTrek.price || 0
        });
      }
    }

    return NextResponse.json({ 
      popularTreks: combinedTreks,
      total: combinedTreks.length 
    });
  } catch (error) {
    console.error('Error in popular treks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
