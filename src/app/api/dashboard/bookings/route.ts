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

    // Get URL parameters for filtering and pagination
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build query - filter by user_id instead of customer_email for better accuracy
    let query = supabaseAdmin
      .from('bookings')
      .select(`
        id,
        status,
        total_amount,
        created_at,
        booking_date,
        trek_slug,
        participants,
        customer_name,
        customer_email,
        customer_phone,
        customer_age,
        customer_dob,
        customer_gender,
        medical_conditions,
        trekking_experience,
        fitness_consent,
        residential_address,
        terms_accepted,
        liability_waiver_accepted,
        covid_declaration_accepted,
        special_requirements,
        payment_status,
        gst_amount,
        base_amount
      `)
      .eq('user_id', sessionData.user_id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
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

    // Helper function to calculate age from date of birth
    const calculateAge = (dateOfBirth: string | null): number | null => {
      if (!dateOfBirth) return null;
      
      try {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        
        return age;
      } catch (error) {
        console.error('Error calculating age:', error);
        return null;
      }
    };

    // Format the bookings data
    const formattedBookings = bookings?.map(booking => {
      const dbTrek = dbTrekData[booking.trek_slug] || {};
      const jsonTrek = trekData[booking.trek_slug] || {};
      
      // Calculate age from DOB
      const calculatedAge = calculateAge(booking.customer_dob);
      
      // Prioritize database data, fallback to JSON, then defaults
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
        paymentStatus: booking.payment_status,
        totalAmount: booking.total_amount,
        participants: booking.participants,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        customerAge: calculatedAge || booking.customer_age, // Use calculated age from DOB, fallback to stored age
        customerDob: booking.customer_dob,
        customerGender: booking.customer_gender,
        medicalConditions: booking.medical_conditions,
        trekkingExperience: booking.trekking_experience,
        fitnessConsent: booking.fitness_consent,
        residentialAddress: booking.residential_address,
        termsAccepted: booking.terms_accepted,
        liabilityWaiverAccepted: booking.liability_waiver_accepted,
        covidDeclarationAccepted: booking.covid_declaration_accepted,
        specialRequirements: booking.special_requirements,
        gstAmount: booking.gst_amount,
        baseAmount: booking.base_amount,
        createdAt: booking.created_at,
        trekSlug: booking.trek_slug
      };
    }) || [];

    // Apply search filter after formatting (since we need trek names)
    let filteredBookings = formattedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = formattedBookings.filter(booking =>
        booking.trekName.toLowerCase().includes(searchLower) ||
        booking.region.toLowerCase().includes(searchLower) ||
        booking.status.toLowerCase().includes(searchLower)
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseAdmin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sessionData.user_id);

    return NextResponse.json({ 
      success: true, 
      bookings: filteredBookings,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
