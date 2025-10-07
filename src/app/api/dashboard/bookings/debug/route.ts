import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Starting bookings API debug');
    
    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    console.log('🔍 Debug: Session ID:', sessionId);
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized', debug: 'No session ID' }, { status: 401 });
    }

    // Get user session
    const { data: sessionData, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('🔍 Debug: Session data:', sessionData);
    console.log('🔍 Debug: Session error:', sessionError);

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session', debug: 'Session not found' }, { status: 401 });
    }

    // Get user data
    const { data: userData, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    console.log('🔍 Debug: User data:', userData);
    console.log('🔍 Debug: User error:', userError);

    if (!userData) {
      return NextResponse.json({ error: 'User not found', debug: 'User not found in auth_user' }, { status: 404 });
    }

    // Test basic bookings query
    const { data: basicBookings, error: basicError } = await supabaseAdmin
      .from('bookings')
      .select('id, status, total_amount, trek_slug, customer_name')
      .eq('user_id', sessionData.user_id)
      .limit(5);

    console.log('🔍 Debug: Basic bookings:', basicBookings);
    console.log('🔍 Debug: Basic error:', basicError);

    // Test full query
    const { data: fullBookings, error: fullError } = await supabaseAdmin
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
        base_amount,
        advance_amount
      `)
      .eq('user_id', sessionData.user_id)
      .limit(5);

    console.log('🔍 Debug: Full bookings:', fullBookings);
    console.log('🔍 Debug: Full error:', fullError);

    return NextResponse.json({ 
      debug: 'Success',
      sessionId,
      userId: sessionData.user_id,
      userEmail: userData.email,
      basicBookings,
      basicError,
      fullBookings,
      fullError,
      basicCount: basicBookings?.length || 0,
      fullCount: fullBookings?.length || 0
    });

  } catch (error) {
    console.error('🔍 Debug: Catch error:', error);
    return NextResponse.json(
      { error: 'Debug error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
