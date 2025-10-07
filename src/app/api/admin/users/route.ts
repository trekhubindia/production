import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
 
export async function GET() {
  const { data, error } = await supabaseAdmin.from('auth_user').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
} 