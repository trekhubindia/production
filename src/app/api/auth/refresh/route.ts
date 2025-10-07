import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Extend session by 30 days
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: updateError } = await supabaseAdmin
      .from('user_session')
      .update({
        expires_at: newExpiresAt,
        last_activity: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error refreshing session:', updateError);
      return NextResponse.json(
        { error: 'Failed to refresh session' },
        { status: 500 }
      );
    }

    // Update cookie with new expiration
    cookieStore.set('auth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return NextResponse.json(
      { 
        message: 'Session refreshed successfully',
        expires_at: newExpiresAt
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 