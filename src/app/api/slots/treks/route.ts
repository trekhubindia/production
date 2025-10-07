import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  const { data: treks, error } = await supabaseAdmin
    .from('treks')
    .select('id, name, slug')
    .eq('status', true)
    .order('name');
  if (error) {
    return NextResponse.json({ error: 'Failed to fetch treks' }, { status: 500 });
  }
  return NextResponse.json({ treks }, { status: 200 });
} 