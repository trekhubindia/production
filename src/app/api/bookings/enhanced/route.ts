import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { logErrorToDB } from '@/lib/error-logger';
import { updateSlotBookedCount } from '@/lib/slot-utils';
import { 
  CompleteBookingForm, 
  EnhancedBooking, 
  BookingParticipant, 
  BookingDocument 
} from '@/lib/types/enhanced-booking-types';

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export async function POST(request: NextRequest) {
  try {
    const formData: CompleteBookingForm & {
      voucher_id?: string;
      voucher_code?: string;
      voucher_discount?: number;
      original_amount?: number;
      total_amount?: number;
    } = await request.json();
    
    // Debug: Log the received form data
    console.log('🔍 Enhanced Booking API - Complete received data:', formData);
    console.log('🔍 Enhanced Booking API - Required fields:', {
      trek_slug: formData.trek_slug,
      booking_date: formData.booking_date,
      participants: formData.participants,
      base_amount: formData.base_amount
    });
    console.log('🔍 Enhanced Booking API - Nested data:', {
      health_fitness: formData.health_fitness,
      travel_preferences: formData.travel_preferences,
      participants_details: formData.participants_details,
      special_requirements: formData.special_requirements
    });
    console.log('🔍 Enhanced Booking API - Voucher data:', {
      voucher_id: formData.voucher_id,
      voucher_discount: formData.voucher_discount,
      original_amount: formData.original_amount,
      total_amount: formData.total_amount
    });

    // Get user from session
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    let userEmail = null;
    let session = null;
    let userId = null;

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
        userId = session.user_id;
      }
    }

    if (!userEmail || !userId) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
    }

    // Validate required fields
    const missingFields = [];
    if (!formData.trek_slug) missingFields.push('trek_slug');
    if (!formData.booking_date) missingFields.push('booking_date');
    if (!formData.participants) missingFields.push('participants');
    if (!formData.base_amount) missingFields.push('base_amount');
    
    if (missingFields.length > 0) {
      console.log('🚨 Missing required fields:', {
        trek_slug: formData.trek_slug,
        booking_date: formData.booking_date,
        participants: formData.participants,
        base_amount: formData.base_amount,
        missingFields
      });
      return NextResponse.json(
        { 
          error: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields,
          receivedData: {
            trek_slug: formData.trek_slug,
            booking_date: formData.booking_date,
            participants: formData.participants,
            base_amount: formData.base_amount
          }
        },
        { status: 400 }
      );
    }

    // Validate participants
    if (formData.participants < 1 || formData.participants > 20) {
      return NextResponse.json(
        { error: 'Number of participants must be between 1 and 20' },
        { status: 400 }
      );
    }

    // Check if user is activated
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .select('is_activated')
      .eq('user_id', userId)
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
      .eq('trek_slug', formData.trek_slug)
      .eq('date', formData.booking_date)
      .single();

    // Also get the trek_id from treks table
    const { data: trekData, error: trekError } = await supabaseAdmin
      .from('treks')
      .select('id')
      .eq('slug', formData.trek_slug)
      .single();

    if (trekError || !trekData) {
      console.error('Error finding trek:', trekError);
      return NextResponse.json(
        { error: 'Trek not found.' },
        { status: 400 }
      );
    }

    if (slotError || !slotData) {
      console.error('Error finding slot:', slotError);
      return NextResponse.json(
        { error: 'Selected date is not available for booking.' },
        { status: 400 }
      );
    }

    // Calculate GST and total amount
    const gstAmount = Math.round(formData.base_amount * 0.05); // 5% GST
    const totalAmount = formData.base_amount + gstAmount;

    // Prepare enhanced booking data
    const enhancedBookingData: Partial<EnhancedBooking> = {
      user_id: userId,
      trek_slug: formData.trek_slug,
      slot_id: slotData.id,
      booking_date: formData.booking_date,
      participants: formData.participants,
      
      // Pricing Information
      base_amount: formData.base_amount,
      gst_amount: gstAmount,
      total_amount: totalAmount,
      
      // Personal Information - Use primary participant data
      customer_name: formData.participants_details[0]?.full_name || 'Not provided',
      customer_email: formData.participants_details[0]?.email_address || 'Not provided',
      customer_phone: formData.participants_details[0]?.contact_number || 'Not provided',
      customer_dob: formData.participants_details[0]?.date_of_birth || null,
      customer_age: null, // Will be calculated from DOB if needed
      customer_gender: formData.participants_details[0]?.gender || null,
      emergency_contact_name: formData.health_fitness.emergency_contact_name || null,
      emergency_contact_phone: formData.health_fitness.emergency_contact_phone || null,
      
      // Health & Fitness Information
      medical_conditions: formData.health_fitness.medical_conditions || null,
      recent_illnesses: formData.health_fitness.recent_illnesses || null,
      current_medications: formData.health_fitness.current_medications || null,
      trekking_experience: formData.health_fitness.trekking_experience || null,
      fitness_consent: formData.health_fitness.fitness_consent,
      
      // Address - Use primary participant data
      residential_address: formData.participants_details[0]?.residential_address || null,
      
      // Travel & Accommodation Preferences
      needs_transportation: formData.travel_preferences.needs_transportation || false,
      pickup_point: formData.travel_preferences.pickup_point || null,
      accommodation_preferences: formData.travel_preferences.accommodation_preferences || null,
      
      // Legal & Consent (with defaults if missing)
      terms_accepted: formData.legal_consent?.terms_accepted || false,
      liability_waiver_accepted: formData.legal_consent?.liability_waiver_accepted || false,
      covid_declaration_accepted: formData.legal_consent?.covid_declaration_accepted || false,
      
      // Optional Add-ons (with defaults if missing)
      trek_gear_rental: formData.optional_addons?.trek_gear_rental || false,
      porter_services: formData.optional_addons?.porter_services || false,
      addon_details: formData.optional_addons?.addon_details || null,
      
      // Special Requirements
      special_requirements: formData.special_requirements || 
                           formData.travel_preferences.special_requirements || null,
      
      // Status Information
      status: 'pending_approval',
      payment_status: 'not_required',
    };

    // Apply voucher if provided
    if (formData.voucher_id) {
      console.log('🎫 Applying voucher:', formData.voucher_id);
      
      try {
        const voucherResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/vouchers/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.voucher_code || formData.voucher_id, // Use voucher_code if available, fallback to voucher_id
            amount: formData.original_amount || formData.base_amount * formData.participants,
            userId: userId,
            bookingId: null // Will be updated after booking creation
          })
        });

        const voucherResult = await voucherResponse.json();
        
        if (voucherResult.success) {
          console.log('✅ Voucher applied successfully:', voucherResult);
          // Update booking data with voucher information
          enhancedBookingData.total_amount = voucherResult.final_amount;
          // Add voucher fields to the booking data
          (enhancedBookingData as any).voucher_discount = voucherResult.discount_amount;
          (enhancedBookingData as any).voucher_id = voucherResult.voucher_id;
        } else {
          console.warn('⚠️ Voucher application failed:', voucherResult.error);
          // Continue with booking without voucher
        }
      } catch (voucherError) {
        console.error('❌ Voucher application error:', voucherError);
        // Continue with booking without voucher
      }
    }

    // Create the enhanced booking
    const { data: bookingData, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(enhancedBookingData)
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating enhanced booking:', bookingError);
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    // Create participant records if participants details are provided
    if (formData.participants_details && formData.participants_details.length > 0) {
      const participantRecords: Partial<BookingParticipant>[] = formData.participants_details.map(participant => ({
        booking_id: bookingData.id,
        full_name: participant.full_name,
        age: participant.date_of_birth ? calculateAge(participant.date_of_birth) : null,
        gender: participant.gender || null,
        contact_number: participant.contact_number || null,
        email_address: participant.email_address || null,
      }));

      const { error: participantsError } = await supabaseAdmin
        .from('booking_participants')
        .insert(participantRecords);

      if (participantsError) {
        console.error('Error creating participant records:', participantsError);
        // Don't fail the booking if participant creation fails, just log it
      }
    }

    // Create document records if any files were uploaded (excluding ID proof)
    const documentRecords: Partial<BookingDocument>[] = [];
    
    // Note: ID proof documents removed from booking system
    // Add other document types here if needed in future

    if (documentRecords.length > 0) {
      const { error: documentsError } = await supabaseAdmin
        .from('booking_documents')
        .insert(documentRecords);

      if (documentsError) {
        console.error('Error creating document records:', documentsError);
        // Don't fail the booking if document creation fails, just log it
      }
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

    console.log('Enhanced booking created successfully:', bookingData.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Enhanced booking created successfully',
        booking: {
          id: bookingData.id,
          trekSlug: formData.trek_slug,
          bookingDate: formData.booking_date,
          participants: formData.participants,
          totalAmount: totalAmount,
          customerName: formData.participants_details[0]?.full_name || 'Not provided',
          customerEmail: formData.participants_details[0]?.email_address || 'Not provided',
        },
        bookingId: bookingData.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Enhanced booking creation error:', error);
    await logErrorToDB(error, 'api/bookings/enhanced POST');
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
    const bookingId = searchParams.get('bookingId');

    if (!email && !bookingId) {
      return NextResponse.json(
        { error: 'Email or bookingId parameter is required' },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from('bookings')
      .select(`
        *,
        booking_participants (*),
        booking_documents (*)
      `);

    if (bookingId) {
      query = query.eq('id', bookingId);
    } else {
      query = query.eq('customer_email', email);
    }

    const { data: bookings, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching enhanced bookings:', error);
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
    console.error('Error fetching enhanced bookings:', error);
    await logErrorToDB(error, 'api/bookings/enhanced GET');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 