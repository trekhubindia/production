import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from('vouchers')
      .select('id, code, discount_percent, valid_until, is_used, created_at')
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vouchers: data });
  } catch (error) {
    console.error('Vouchers GET error:', error);
    await logErrorToDB(error, 'api/vouchers GET');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 