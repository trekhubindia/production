import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { TrekPriceBreakdown } from '@/lib/types/enhanced-booking-types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Trek slug is required' },
        { status: 400 }
      );
    }

    // Get trek information
    const { data: trek, error: trekError } = await supabaseAdmin
      .from('treks')
      .select('price, name')
      .eq('slug', slug)
      .single();

    if (trekError || !trek) {
      return NextResponse.json(
        { error: 'Trek not found' },
        { status: 404 }
      );
    }

    // The stored price is the base price (before GST)
    const basePrice = trek.price || 0;
    const gstAmount = Math.round(basePrice * 0.05); // Calculate 5% GST
    const totalPriceWithGst = basePrice + gstAmount; // Add GST to base price

    const priceBreakdown: TrekPriceBreakdown = {
      trek_slug: slug,
      total_price_with_gst: totalPriceWithGst,
      base_price: basePrice,
      gst_amount: gstAmount,
      gst_percentage: '5%',
    };

    return NextResponse.json(
      { priceBreakdown },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching price breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 