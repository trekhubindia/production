import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';

interface VoucherApplicationResult {
  success: boolean;
  voucher_id?: string;
  discount_amount?: number;
  final_amount?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { code, amount, userId, bookingId } = await request.json();

    if (!code || !amount || !userId) {
      return NextResponse.json({
        success: false,
        error: 'Voucher code, amount, and user ID are required'
      } as VoucherApplicationResult, { status: 400 });
    }

    // Start a transaction to ensure atomicity
    const { data: voucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('id, code, discount_percent, valid_until, is_used, user_id, is_active, minimum_amount, maximum_discount')
      .eq('code', code.toUpperCase())
      .eq('is_used', false) // Only get unused vouchers
      .eq('is_active', true) // Only get active vouchers
      .single();

    if (fetchError || !voucher) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or already used voucher code'
      } as VoucherApplicationResult);
    }

    // Check if voucher is expired
    const now = new Date();
    const validUntil = new Date(voucher.valid_until);
    if (validUntil < now) {
      return NextResponse.json({
        success: false,
        error: 'This voucher has expired'
      } as VoucherApplicationResult);
    }

    // Check if voucher is user-specific
    if (voucher.user_id && voucher.user_id !== userId) {
      return NextResponse.json({
        success: false,
        error: 'This voucher is not valid for your account'
      } as VoucherApplicationResult);
    }

    // Check minimum amount requirement
    if (voucher.minimum_amount && amount < voucher.minimum_amount) {
      return NextResponse.json({
        success: false,
        error: `Minimum order amount of ₹${voucher.minimum_amount} required for this voucher`
      } as VoucherApplicationResult);
    }

    // Calculate discount
    let discountAmount = Math.round((amount * voucher.discount_percent) / 100);
    
    // Apply maximum discount limit if specified
    if (voucher.maximum_discount && discountAmount > voucher.maximum_discount) {
      discountAmount = voucher.maximum_discount;
    }
    
    const finalAmount = Math.max(0, amount - discountAmount);

    // Mark voucher as used
    const { error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({ 
        is_used: true,
        used_at: new Date().toISOString(),
        used_by: userId,
        booking_id: bookingId || null
      })
      .eq('id', voucher.id)
      .eq('is_used', false); // Double-check it's still unused

    if (updateError) {
      console.error('Error marking voucher as used:', updateError);
      return NextResponse.json({
        success: false,
        error: 'Failed to apply voucher. It may have been used by someone else.'
      } as VoucherApplicationResult, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      voucher_id: voucher.id,
      discount_amount: discountAmount,
      final_amount: finalAmount
    } as VoucherApplicationResult);

  } catch (error) {
    console.error('Voucher application error:', error);
    await logErrorToDB(error, 'api/vouchers/apply POST');
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    } as VoucherApplicationResult, { status: 500 });
  }
}
