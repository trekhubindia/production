import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';

interface VoucherValidationResult {
  valid: boolean;
  voucher?: {
    id: string;
    code: string;
    discount_percent: number;
    valid_until: string;
    is_used: boolean;
    user_id: string | null;
  };
  error?: string;
  discount_amount?: number;
  final_amount?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { code, amount, userId } = await request.json();

    if (!code || !amount) {
      return NextResponse.json({
        valid: false,
        error: 'Voucher code and amount are required'
      } as VoucherValidationResult, { status: 400 });
    }

    // Fetch voucher from database
    const { data: voucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('id, code, discount_percent, valid_until, is_used, user_id, is_active, minimum_amount, maximum_discount')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !voucher) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid voucher code'
      } as VoucherValidationResult);
    }

    // Check if voucher is already used
    if (voucher.is_used) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher has already been used'
      } as VoucherValidationResult);
    }

    // Check if voucher is expired
    const now = new Date();
    const validUntil = new Date(voucher.valid_until);
    if (validUntil < now) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher has expired'
      } as VoucherValidationResult);
    }

    // Check if voucher is user-specific
    if (voucher.user_id && voucher.user_id !== userId) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher is not valid for your account'
      } as VoucherValidationResult);
    }

    // Check minimum amount requirement
    if (voucher.minimum_amount && amount < voucher.minimum_amount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of ₹${voucher.minimum_amount} required for this voucher`
      } as VoucherValidationResult);
    }

    // Calculate discount
    let discountAmount = Math.round((amount * voucher.discount_percent) / 100);
    
    // Apply maximum discount limit if specified
    if (voucher.maximum_discount && discountAmount > voucher.maximum_discount) {
      discountAmount = voucher.maximum_discount;
    }
    
    const finalAmount = Math.max(0, amount - discountAmount);

    return NextResponse.json({
      valid: true,
      voucher,
      discount_amount: discountAmount,
      final_amount: finalAmount
    } as VoucherValidationResult);

  } catch (error) {
    console.error('Voucher validation error:', error);
    await logErrorToDB(error, 'api/vouchers/validate POST');
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    } as VoucherValidationResult, { status: 500 });
  }
}

// GET endpoint to check voucher without applying
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const userId = searchParams.get('userId');

    if (!code) {
      return NextResponse.json({
        valid: false,
        error: 'Voucher code is required'
      } as VoucherValidationResult, { status: 400 });
    }

    // Fetch voucher from database
    const { data: voucher, error: fetchError } = await supabaseAdmin
      .from('vouchers')
      .select('id, code, discount_percent, valid_until, is_used, user_id')
      .eq('code', code.toUpperCase())
      .single();

    if (fetchError || !voucher) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid voucher code'
      } as VoucherValidationResult);
    }

    // Check if voucher is already used
    if (voucher.is_used) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher has already been used'
      } as VoucherValidationResult);
    }

    // Check if voucher is expired
    const now = new Date();
    const validUntil = new Date(voucher.valid_until);
    if (validUntil < now) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher has expired'
      } as VoucherValidationResult);
    }

    // Check if voucher is user-specific
    if (voucher.user_id && voucher.user_id !== userId) {
      return NextResponse.json({
        valid: false,
        error: 'This voucher is not valid for your account'
      } as VoucherValidationResult);
    }

    return NextResponse.json({
      valid: true,
      voucher
    } as VoucherValidationResult);

  } catch (error) {
    console.error('Voucher check error:', error);
    await logErrorToDB(error, 'api/vouchers/validate GET');
    return NextResponse.json({
      valid: false,
      error: 'Internal server error'
    } as VoucherValidationResult, { status: 500 });
  }
}
