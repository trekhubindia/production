import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Support both sync and async params as Next.js type generation may vary
    const { id } = await context.params;

    const body = await request.json();
    const { booked, capacity, status } = body;

    // Validate input
    if (booked !== undefined && (booked < 0 || booked > (capacity || 100))) {
      return NextResponse.json(
        { error: 'Invalid booked count' },
        { status: 400 }
      );
    }

    // Update slot
    const updateData: Record<string, unknown> = {};
    if (booked !== undefined) updateData.booked = booked;
    if (capacity !== undefined) updateData.capacity = capacity;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabaseAdmin
      .from('trek_slots')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating slot:', error);
      return NextResponse.json(
        { error: 'Failed to update slot', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ slot: data }, { status: 200 });
  } catch (error) {
    console.error('Slot update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 