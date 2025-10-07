import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    console.log('Test API - Session ID:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json({ 
        error: 'No session found',
        sessionId: sessionId,
        cookies: cookieStore.getAll()
      }, { status: 401 });
    }

    // Get user session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('Test API - Session data:', { sessionData, sessionError });

    if (!sessionData) {
      return NextResponse.json({ 
        error: 'Invalid session',
        sessionError: sessionError
      }, { status: 401 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    console.log('Test API - User data:', { userData, userError });

    if (!userData) {
      return NextResponse.json({ 
        error: 'User not found',
        userError: userError
      }, { status: 404 });
    }

    // Test bookings query
    const { data: bookings, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_email', userData.email)
      .limit(1);

    console.log('Test API - Bookings:', { bookings, bookingsError });

    return NextResponse.json({ 
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      bookingsCount: bookings?.length || 0,
      sampleBooking: bookings?.[0] || null
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
