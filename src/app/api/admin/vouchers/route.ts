import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';
import { cookies } from 'next/headers';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';

export async function GET() {
  try {
    // Check admin permissions
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: vouchers, error } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vouchers:', error);
      return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
    }

    return NextResponse.json({ vouchers: vouchers || [] });
  } catch (error) {
    console.error('Error in vouchers GET:', error);
    await logErrorToDB(error, 'api/admin/vouchers GET');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      code, 
      discount_percent, 
      valid_until, 
      user_id, 
      description, 
      minimum_amount, 
      maximum_discount, 
      max_uses, 
      is_active 
    } = await request.json();

    // Validate required fields
    if (!code || !discount_percent || !valid_until || !max_uses) {
      return NextResponse.json(
        { error: 'Missing required fields: code, discount_percent, valid_until, max_uses' },
        { status: 400 }
      );
    }

    // Validate discount percentage
    if (discount_percent < 1 || discount_percent > 100) {
      return NextResponse.json(
        { error: 'Discount percentage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate max uses
    if (max_uses < 1) {
      return NextResponse.json(
        { error: 'Max uses must be at least 1' },
        { status: 400 }
      );
    }

    // Validate date is in the future
    if (new Date(valid_until) <= new Date()) {
      return NextResponse.json(
        { error: 'Valid until date must be in the future' },
        { status: 400 }
      );
    }

    // Check if voucher code already exists
    const { data: existingVoucher, error: checkError } = await supabaseAdmin
      .from('vouchers')
      .select('id')
      .eq('code', code)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing voucher:', checkError);
      return NextResponse.json({ error: 'Failed to check voucher code' }, { status: 500 });
    }

    if (existingVoucher) {
      return NextResponse.json(
        { error: 'Voucher code already exists' },
        { status: 400 }
      );
    }

    // Create voucher
    const { data: voucher, error: createError } = await supabaseAdmin
      .from('vouchers')
      .insert({
        code: code.toUpperCase(),
        discount_percent,
        valid_until,
        user_id: user_id || null,
        description: description || null,
        minimum_amount: minimum_amount || null,
        maximum_discount: maximum_discount || null,
        max_uses: max_uses || 1,
        current_uses: 0,
        is_active: is_active ?? true,
        is_used: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating voucher:', createError);
      return NextResponse.json(
        { error: 'Failed to create voucher' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Voucher created successfully', voucher },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in vouchers POST:', error);
    await logErrorToDB(error, 'api/admin/vouchers POST');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 