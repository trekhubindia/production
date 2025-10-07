import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { notifyNewBookingToAdmins } from '@/lib/realtime-admin';
import { cookies } from 'next/headers';
import { logErrorToDB } from '@/lib/error-logger';
import { updateSlotBookedCount } from '@/lib/slot-utils';

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    
    // Check if this is an enhanced booking request
    if (requestData.personal_info && requestData.health_fitness && requestData.address_info) {
      // This is an enhanced booking, redirect to enhanced endpoint
      const enhancedResponse = await fetch(`${request.nextUrl.origin}/api/bookings/enhanced`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      
      const enhancedData = await enhancedResponse.json();
      return NextResponse.json(enhancedData, { status: enhancedResponse.status });
    }
    
    // Legacy booking format
    const {
      trekId, // This will actually be trek_slug
      trekDate,
      participants,
      totalAmount,
      customerName,
      customerPhone,
      specialRequirements
    } = requestData;

    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    let userEmail = null;
    let session = null;
    if (sessionId) {
      const { data: sessionData } = await supabaseAdmin
        .from('user_session')
        .select('*')
        .eq('id', sessionId)
        .single();
      session = sessionData;
      if (session) {
        const { data: userData } = await supabaseAdmin
          .from('auth_user')
          .select('email')
          .eq('id', session.user_id)
          .single();
        userEmail = userData?.email;
      }
    }
    if (!userEmail) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // Validate required fields
    if (!trekId || !trekDate || !participants || !totalAmount || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate participants
    if (participants < 1 || participants > 20) {
      return NextResponse.json(
        { error: 'Number of participants must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Convert totalAmount to a number (strip currency symbols and commas)
    const numericTotalAmount = Number(
      String(totalAmount).replace(/[^0-9.]/g, '')
    );

    // Check if user is activated
    if (!session?.user_id || !/^[0-9a-fA-F-]{36}$/.test(session.user_id)) {
      return NextResponse.json(
        { error: 'Invalid user session.' },
        { status: 400 }
      );
    }
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .select('is_activated')
      .eq('user_id', session.user_id)
      .single();
    if (activationError) {
      return NextResponse.json(
        { error: 'Could not verify user activation status.' },
        { status: 500 }
      );
    }
    if (activation && activation.is_activated === false) {
      return NextResponse.json(
        { error: 'Please activate your account via the email link before booking.' },
        { status: 403 }
      );
    }

    // Find the slot_id for this trek and date
    const { data: slotData, error: slotError } = await supabaseAdmin
      .from('trek_slots')
      .select('id')
      .eq('trek_slug', trekId)
      .eq('date', trekDate)
      .single();

    if (slotError || !slotData) {
      console.error('🔍 Debug: Error finding slot:', slotError);
      return NextResponse.json(
        { error: 'Selected date is not available for booking.' },
        { status: 400 }
      );
    }

    // Store booking in database
    console.log('🔍 Debug: Attempting to create booking with data:', {
      trek_slug: trekId,
      slot_id: slotData.id,
      booking_date: trekDate,
      participants: participants,
      total_amount: numericTotalAmount,
      customer_name: customerName,
      customer_email: userEmail,
      customer_phone: customerPhone || null,
      special_requirements: specialRequirements || null,
      status: 'pending',
      user_id: session.user_id,
    });

    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        trek_slug: trekId,
        slot_id: slotData.id,
        booking_date: trekDate,
        participants: participants,
        total_amount: numericTotalAmount,
        customer_name: customerName,
        customer_email: userEmail,
        customer_phone: customerPhone || null,
        special_requirements: specialRequirements || null,
        status: 'pending_approval',
        payment_status: 'not_required',
        user_id: session.user_id,
      })
      .select()
      .single();

    console.log('🔍 Debug: Booking insert result:', { 
      success: !bookingError, 
      data: bookingData, 
      error: bookingError 
    });

    if (bookingError) {
      console.error('🔍 Debug: Error creating booking:', bookingError);
      console.error('🔍 Debug: Booking error details:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      });
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    // Update slot booked count
    if (bookingData && slotData.id) {
      try {
        const slotUpdateResult = await updateSlotBookedCount(slotData.id);
        if (slotUpdateResult.success) {
          console.log(`✅ Updated slot ${slotData.id} booked count: ${slotUpdateResult.bookedCount}`);
        } else {
          console.warn(`⚠️ Failed to update slot booked count: ${slotUpdateResult.error}`);
        }
      } catch (e) {
        console.warn('Slot count update failed (non-blocking):', e);
      }
    }

    // Broadcast to admin listeners
    if (bookingData) {
      try {
        await notifyNewBookingToAdmins(bookingData);
      } catch (e) {
        console.warn('Realtime admin broadcast failed (non-blocking):', e);
      }
    }

    // Don't send confirmation email here - it will be sent after payment
    console.log('Booking created with pending status - confirmation email will be sent after payment');

    return NextResponse.json(
      {
        success: true,
        message: 'Booking created successfully',
        booking: {
          id: bookingData.id,
          trekSlug: trekId,
          trekDate,
          participants,
          totalAmount,
          customerName,
          customerEmail: userEmail,
        },
        bookingId: bookingData.id, // Return booking ID for payment page
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking creation error:', error);
    await logErrorToDB(error, 'api/bookings POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get bookings for the customer
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('customer_email', email)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { bookings: bookings || [] },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching bookings:', error);
    await logErrorToDB(error, 'api/bookings GET');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 