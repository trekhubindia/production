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
    overview?: {
      altitude?: string;
      grade?: string;
      best_time?: string;
    };
    itinerary?: {
      days?: Array<{
        day: number;
        title: string;
        description: string;
        altitude?: string;
      }>;
    };
  };
}

// Function to get upcoming months (next 3 months)
const getUpcomingMonths = () => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 3; i++) {
    const futureDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = futureDate.toLocaleString('default', { month: 'long' });
    months.push(monthName.toLowerCase());
  }
  
  return months;
};

// Function to check if trek is upcoming based on best time
const isUpcomingTrek = (trek: JsonTrek) => {
  const bestTime = trek.sections?.overview?.best_time;
  if (!bestTime) return false;
  
  const upcomingMonths = getUpcomingMonths();
  const trekBestTime = bestTime.toLowerCase();
  
  return upcomingMonths.some(month => 
    trekBestTime.includes(month)
  );
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    
    // Get dynamic data from database
    const { data: dynamicData, error } = await supabase
      .from('treks')
      .select('*')
      .eq('status', true)
      .order('featured', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching treks:', error);
      return NextResponse.json({ error: 'Failed to fetch treks' }, { status: 500 });
    }

    // Get slot data for all treks
    const { data: slotsData, error: slotsError } = await supabase
      .from('trek_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]) // Only future slots
      .eq('status', 'open'); // Only open slots

    if (slotsError) {
      console.error('Error fetching slots:', slotsError);
    }

    // Combine with JSON data
    const jsonTreks = (trekData as { treks: JsonTrek[] }).treks;
    const combinedTreks = [];

    for (const dbTrek of dynamicData || []) {
      const jsonTrek = jsonTreks.find((t: JsonTrek) => t.slug === dbTrek.slug);
      if (jsonTrek) {
        // Get slots for this trek using trek_slug
        const trekSlots = slotsData?.filter(slot => slot.trek_slug === dbTrek.slug) || [];
        
        // Calculate total available slots
        const totalSlots = trekSlots.reduce((sum, slot) => sum + (slot.capacity || 0), 0);
        const bookedSlots = trekSlots.reduce((sum, slot) => sum + (slot.booked || 0), 0);
        const availableSlots = totalSlots - bookedSlots;

        // Calculate max altitude from itinerary if available
        let maxAltitude = jsonTrek.sections?.overview?.altitude || 'N/A';
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

        const combinedTrek = {
          id: dbTrek.id,
          name: jsonTrek.name,
          slug: jsonTrek.slug,
          description: jsonTrek.description,
          region: jsonTrek.region,
          difficulty: jsonTrek.difficulty,
          duration: jsonTrek.duration,
          price: dbTrek.price || 0,
          rating: dbTrek.rating || 0,
          image: dbTrek.image || '/images/placeholder-trek.jpg',
          status: dbTrek.status,
          featured: dbTrek.featured,
          created_at: dbTrek.updated_at || dbTrek.created_at,
          best_time: jsonTrek.sections?.overview?.best_time || 'Year-round',
          sections: {
            overview: {
              altitude: maxAltitude,
              grade: jsonTrek.sections?.overview?.grade || jsonTrek.difficulty,
              best_time: jsonTrek.sections?.overview?.best_time || 'Year-round'
            }
          },
          slots: trekSlots,
          totalSlots,
          availableSlots,
          bookedSlots,
          hasFewSeats: availableSlots > 0 && availableSlots <= 5
        };

        combinedTreks.push(combinedTrek);
      }
    }

    // Filter treks that have available slots and sort by nearest slot date
    const treksWithSlots = combinedTreks
      .filter(trek => trek.availableSlots > 0 && trek.slots.length > 0)
      .map(trek => {
        // Find the nearest slot date
        const nearestSlot = trek.slots
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        
        return {
          ...trek,
          nearestSlotDate: nearestSlot ? new Date(nearestSlot.date) : null,
          nearestSlotDateString: nearestSlot ? nearestSlot.date : null
        };
      })
      .filter(trek => trek.nearestSlotDate) // Only include treks with valid slot dates
      .sort((a, b) => {
        // Sort by nearest slot date (ascending - closest dates first)
        return a.nearestSlotDate!.getTime() - b.nearestSlotDate!.getTime();
      });

    // Take the requested number of treks with nearest slot dates
    let finalTreks = treksWithSlots.slice(0, limit);
    
    // If not enough treks with slots, add other treks (featured/popular)
    if (finalTreks.length < limit) {
      const remainingSlots = limit - finalTreks.length;
      const otherTreks = combinedTreks
        .filter(trek => !treksWithSlots.some(t => t.id === trek.id))
        .sort((a, b) => {
          // Prioritize featured treks, then by rating
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.rating || 0) - (a.rating || 0);
        })
        .slice(0, remainingSlots);
      
      finalTreks = [...finalTreks, ...otherTreks];
    }

    // Count how many treks are truly upcoming (within next 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const upcomingCount = treksWithSlots.filter(trek => 
      trek.nearestSlotDate && trek.nearestSlotDate <= threeMonthsFromNow
    ).length;

    return NextResponse.json({ 
      treks: finalTreks,
      total: finalTreks.length,
      upcomingCount: upcomingCount
    });
  } catch (error) {
    console.error('Error in upcoming treks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
