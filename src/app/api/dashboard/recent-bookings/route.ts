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

    // Get user's recent bookings (last 3)
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        booking_date,
        trek_slug,
        participants,
        customer_name
      `)
      .eq('user_id', userData.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (bookingsError) {
      console.error('Error fetching recent bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch recent bookings' }, { status: 500 });
    }

    // Load trek data from database and JSON file
    let trekData: any = {};
    let dbTrekData: any = {};
    
    // First, get trek data from database (for images and updated info)
    try {
      const { data: dbTreks } = await supabaseAdmin
        .from('treks')
        .select('slug, name, region, difficulty, duration, price, image')
        .in('slug', bookings?.map(b => b.trek_slug) || []);
      
      dbTrekData = (dbTreks || []).reduce((acc: any, trek: any) => {
        acc[trek.slug] = trek;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error loading trek data from database:', error);
    }
    
    // Then load from JSON file as fallback
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
      console.error('Error loading trek data from JSON:', error);
    }

    // Format the bookings data
    const formattedBookings = bookings?.map(booking => {
      const dbTrek = dbTrekData[booking.trek_slug] || {};
      const jsonTrek = trekData[booking.trek_slug] || {};
      
      return {
        id: booking.id,
        trekName: dbTrek.name || jsonTrek.name || booking.trek_slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Trek',
        region: dbTrek.region || jsonTrek.region || 'India',
        difficulty: dbTrek.difficulty || jsonTrek.difficulty || 'Moderate',
        duration: dbTrek.duration || jsonTrek.duration || '5-7 Days',
        altitude: jsonTrek.sections?.overview?.altitude || '3000m+',
        price: dbTrek.price || jsonTrek.price || 0,
        rating: jsonTrek.rating || 4.5,
        image: dbTrek.image || jsonTrek.image || '/images/default-trek.jpg',
        trekDate: booking.booking_date,
        status: booking.status,
        totalAmount: booking.total_amount,
        participants: booking.participants,
        customerName: booking.customer_name,
        createdAt: booking.created_at,
        trekSlug: booking.trek_slug
      };
    }) || [];

    return NextResponse.json({ success: true, bookings: formattedBookings });

  } catch (error) {
    console.error('Recent bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
