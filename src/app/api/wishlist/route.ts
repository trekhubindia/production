import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { logErrorToDB } from '@/lib/error-logger';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .select('id, trek_id, created_at')
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ wishlists: data });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    await logErrorToDB(error, 'api/wishlist GET');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { trek_id } = await request.json();
    if (!trek_id) return NextResponse.json({ error: 'Missing trek_id' }, { status: 400 });
    const { data, error } = await supabaseAdmin
      .from('wishlists')
      .insert({ user_id: userId, trek_id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ wishlist: data });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    await logErrorToDB(error, 'api/wishlist POST');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { trek_id } = await request.json();
    if (!trek_id) return NextResponse.json({ error: 'Missing trek_id' }, { status: 400 });
    const { error } = await supabaseAdmin
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('trek_id', trek_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    await logErrorToDB(error, 'api/wishlist DELETE');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 