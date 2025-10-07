import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = userData.email;

    // Get URL parameters for filtering
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter') || 'all';
    const search = url.searchParams.get('search') || '';
    const sortBy = url.searchParams.get('sortBy') || 'added-date';

    // Get user's wishlist items with trek details
    const { data: wishlistItems, error: wishlistError } = await supabaseAdmin
      .from('wishlists')
      .select(`
        id,
        trek_id,
        created_at,
        treks!inner (
          id,
          slug,
          name,
          price,
          region,
          difficulty,
          duration,
          status,
          featured
        )
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false });

    if (wishlistError) {
      console.error('Error fetching wishlist:', wishlistError);
      return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
    }

    // Load trek data from JSON file
    let trekData: any = {};
    try {
      const treksFilePath = path.join(process.cwd(), 'data', 'treks.json');
      const treksFileContent = fs.readFileSync(treksFilePath, 'utf8');
      const treksJson = JSON.parse(treksFileContent);
      
      // Create a lookup map for quick access
      trekData = treksJson.treks.reduce((acc: any, trek: any) => {
        acc[trek.slug] = trek;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error loading trek data:', error);
    }

    // Format the wishlist data
    let formattedWishlist = wishlistItems?.map(item => {
      const dbTrek = Array.isArray(item.treks) ? item.treks[0] : item.treks;
      const jsonTrek = trekData[dbTrek?.slug] || {};
      
      return {
        id: item.id,
        trek_id: item.trek_id, // Keep the original trek_id
        trek_slug: dbTrek.slug, // Add trek_slug for useWishlist hook
        trekId: dbTrek.slug,
        trekName: dbTrek.name || jsonTrek.name || 'Unknown Trek',
        trek_name: dbTrek.name || jsonTrek.name || 'Unknown Trek', // Add trek_name for useWishlist hook
        region: dbTrek.region || jsonTrek.region || 'India',
        difficulty: dbTrek.difficulty || jsonTrek.difficulty || 'Moderate',
        duration: dbTrek.duration || jsonTrek.duration || '5-7 Days',
        price: dbTrek.price || jsonTrek.price || 0,
        originalPrice: jsonTrek.originalPrice || dbTrek.price || jsonTrek.price || 0,
        rating: jsonTrek.rating || 4.5,
        image: jsonTrek.image || '/images/default-trek.jpg',
        altitude: jsonTrek.sections?.overview?.altitude || '3000m+',
        bestSeason: jsonTrek.sections?.overview?.season || 'All Seasons',
        addedDate: item.created_at,
        created_at: item.created_at, // Keep original format for useWishlist hook
        description: jsonTrek.description || 'An amazing trekking experience awaits you.',
        highlights: jsonTrek.sections?.overview?.highlights || ['Scenic Views', 'Adventure', 'Nature'],
        available: dbTrek.status !== false,
        nextSlot: '2024-12-01' // This could be fetched from trek_slots table
      };
    }) || [];

    // Apply filters
    if (filter !== 'all') {
      formattedWishlist = formattedWishlist.filter(item => {
        switch (filter) {
          case 'available':
            return item.available;
          case 'unavailable':
            return !item.available;
          case 'easy':
            return item.difficulty.toLowerCase().includes('easy');
          case 'moderate':
            return item.difficulty.toLowerCase().includes('moderate');
          case 'difficult':
            return item.difficulty.toLowerCase().includes('difficult');
          default:
            return true;
        }
      });
    }

    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      formattedWishlist = formattedWishlist.filter(item =>
        item.trekName.toLowerCase().includes(searchLower) ||
        item.region.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    formattedWishlist.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'difficulty':
          const difficultyOrder = { 'easy': 1, 'moderate': 2, 'difficult': 3 };
          const aDiff = difficultyOrder[a.difficulty.toLowerCase() as keyof typeof difficultyOrder] || 2;
          const bDiff = difficultyOrder[b.difficulty.toLowerCase() as keyof typeof difficultyOrder] || 2;
          return aDiff - bDiff;
        case 'added-date':
        default:
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
      }
    });

    return NextResponse.json({ 
      success: true, 
      wishlist: formattedWishlist,
      count: formattedWishlist.length
    });

  } catch (error) {
    console.error('Wishlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session and data
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { trek_slug } = await request.json();

    if (!trek_slug) {
      return NextResponse.json({ error: 'Missing trek_slug' }, { status: 400 });
    }

    // Get trek ID from slug
    const { data: trekData, error: trekError } = await supabaseAdmin
      .from('treks')
      .select('id')
      .eq('slug', trek_slug)
      .single();

    if (trekError || !trekData) {
      return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Add to wishlist
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .insert({
        user_id: userData.id,
        trek_id: trekData.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding to wishlist:', error);
      return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data });

  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session and data
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { trek_slug } = await request.json();

    if (!trek_slug) {
      return NextResponse.json({ error: 'Missing trek_slug' }, { status: 400 });
    }

    // Get trek ID from slug
    const { data: trekData, error: trekError } = await supabaseAdmin
      .from('treks')
      .select('id')
      .eq('slug', trek_slug)
      .single();

    if (trekError || !trekData) {
      return NextResponse.json({ error: 'Trek not found' }, { status: 404 });
    }

    // Remove from wishlist
    const { error } = await supabaseAdmin
      .from('wishlists')
      .delete()
      .eq('user_id', userData.id)
      .eq('trek_id', trekData.id);

    if (error) {
      console.error('Error removing from wishlist:', error);
      return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
