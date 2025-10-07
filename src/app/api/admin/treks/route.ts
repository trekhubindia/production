/* eslint-disable */
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  // Check for a session cookie
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('auth_session')?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data, error } = await supabaseAdmin.from('treks').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, region, difficulty, duration, price, rating, image, slug } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if slug already exists
    const { data: existingTrek } = await supabaseAdmin
      .from('treks')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingTrek) {
      return NextResponse.json({ error: 'A trek with this slug already exists' }, { status: 400 });
    }

    // Create the trek
    const { data, error } = await supabaseAdmin
      .from('treks')
      .insert({
        name,
        description,
        region,
        difficulty,
        duration,
        price: price ? parseFloat(price) : null,
        rating: rating ? parseFloat(rating) : null,
        image,
        slug
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 