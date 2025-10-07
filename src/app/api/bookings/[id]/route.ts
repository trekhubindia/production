import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { emailService } from '@/lib/email-service';
import { logErrorToDB } from '@/lib/error-logger';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body as { status?: string };

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Build update payload from allowed fields
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) {
      if (!['pending', 'pending_approval', 'approved', 'confirmed', 'cancelled', 'completed'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: pending, pending_approval, approved, confirmed, cancelled, completed' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Optional editable fields
    const editableFields: Array<keyof typeof body> = [
      'participants',
      'booking_date',
      'trek_date',
      'customer_name',
      'customer_email',
      'customer_phone',
      'special_requirements',
      'pickup_location',
      'payment_status',
    ];
    for (const field of editableFields) {
      if (field in body) {
        updateData[field as string] = (body as unknown)[field];
      }
    }

    // Get the current booking data
    const { data: currentBooking, error: fetchError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabaseAdmin
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    // Send approval email if status changed to 'approved'
    if (status === 'approved' && currentBooking.status !== 'approved') {
      try {
        await emailService.sendEmail({
          to: currentBooking.customer_email,
          subject: `Booking Approved for ${currentBooking.trek_name} on ${currentBooking.trek_date}`,
          text: `Dear ${currentBooking.customer_name},\n\nGreat news! Your booking has been approved by our team.\n\nTrek: ${currentBooking.trek_name}\nDate: ${currentBooking.trek_date}\nParticipants: ${currentBooking.participants}\nTotal Amount: ${currentBooking.total_amount}\n\nYour booking is now confirmed and you're all set for your adventure!\n\nBest regards,\nThe Trek Hub India Team`
        });
        console.log('Booking approval email sent to:', currentBooking.customer_email);
      } catch (e) {
        console.error('Failed to send booking approval email:', e);
        // Don't fail the request if email fails
      }
    }

    // Send confirmation email if status changed to 'confirmed'
    if (status === 'confirmed' && currentBooking.status !== 'confirmed') {
      try {
        await emailService.sendEmail({
          to: currentBooking.customer_email,
          subject: `Booking Confirmed for ${currentBooking.trek_name} on ${currentBooking.trek_date}`,
          text: `Dear ${currentBooking.customer_name},\n\nYour booking has been confirmed!\n\nTrek: ${currentBooking.trek_name}\nDate: ${currentBooking.trek_date}\nParticipants: ${currentBooking.participants}\nTotal Amount: ${currentBooking.total_amount}\n\nWe look forward to seeing you!\n\nBest regards,\nThe Trek Team`
        });
        console.log('Booking confirmation email sent to:', currentBooking.customer_email);
      } catch (e) {
        console.error('Failed to send booking confirmation email:', e);
        // Don't fail the request if email fails
      }
    }

    // Send cancellation email if status changed to 'cancelled'
    if (status === 'cancelled' && currentBooking.status !== 'cancelled') {
      try {
        await emailService.sendEmail({
          to: currentBooking.customer_email,
          subject: `Booking Cancelled for ${currentBooking.trek_name} on ${currentBooking.trek_date}`,
          text: `Dear ${currentBooking.customer_name},\n\nYour booking has been cancelled.\n\nTrek: ${currentBooking.trek_name}\nDate: ${currentBooking.trek_date}\nParticipants: ${currentBooking.participants}\nTotal Amount: ${currentBooking.total_amount}\n\nIf you have unknown questions, please contact us.\n\nBest regards,\nThe Trek Team`
        });
        console.log('Booking cancellation email sent to:', currentBooking.customer_email);
      } catch (e) {
        console.error('Failed to send booking cancellation email:', e);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json(
      {
        message: 'Booking updated successfully',
        booking: updatedBooking
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Booking status update error:', error);
    await logErrorToDB(error, 'api/bookings/[id] PATCH');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json(
        { error: 'Failed to delete booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Booking deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Booking delete error:', error);
    await logErrorToDB(error, 'api/bookings/[id] DELETE');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // First get the booking
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Then get the trek name using the trek_slug
    const { data: trek } = await supabaseAdmin
      .from('treks')
      .select('name')
      .eq('slug', booking.trek_slug)
      .single();

    // Add trek name to booking object
    const bookingWithTrekName = {
      ...booking,
      trek_name: trek?.name || booking.trek_slug
    };

    return NextResponse.json(
      { booking: bookingWithTrekName },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching booking:', error);
    await logErrorToDB(error, 'api/bookings/[id] GET');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 