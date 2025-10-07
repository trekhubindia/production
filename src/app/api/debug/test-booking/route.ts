import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST() {
  try {
    console.log('🔍 Debug: Testing booking creation...');

    // Test data
    const testBooking = {
      trek_slug: 'kedarkantha-trek', // Use actual trek slug
      trek_name: 'Kedarkantha Trek',
      trek_date: '2024-12-25',
      participants: 2,
      total_amount: 100.00,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+1234567890',
      special_requirements: 'Test requirements',
      status: 'pending',
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
    };

    console.log('🔍 Debug: Attempting to create test booking:', testBooking);

    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(testBooking)
      .select()
      .single();

    console.log('🔍 Debug: Test booking result:', { 
      success: !bookingError, 
      data: bookingData, 
      error: bookingError 
    });

    if (bookingError) {
      return NextResponse.json({
        error: 'Test booking failed',
        details: bookingError.message,
        code: bookingError.code,
        hint: bookingError.hint
      }, { status: 500 });
    }

    // Clean up test booking
    if (bookingData?.id) {
      await supabaseAdmin
        .from('bookings')
        .delete()
        .eq('id', bookingData.id);
      console.log('🔍 Debug: Test booking cleaned up');
    }

    return NextResponse.json({
      success: true,
      message: 'Test booking created and cleaned up successfully',
      bookingId: bookingData?.id
    });

  } catch (error) {
    console.error('🔍 Debug: Test booking error:', error);
    return NextResponse.json({
      error: 'Test booking failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 