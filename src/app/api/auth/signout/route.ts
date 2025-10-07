import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (sessionId) {
      // Directly delete session from database (skip activity log update for speed)
      await supabaseAdmin
        .from('user_session')
        .delete()
        .eq('id', sessionId);
      // Optionally, you could log signout activity asynchronously here if needed
    }

    // Clear session cookie
    cookieStore.set('auth_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    // Redirect to homepage instead of returning JSON
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://trekhubindia.com'));
  } catch (error) {
    console.error('Signout error:', error);
    // Even on error, redirect to homepage
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://trekhubindia.com'));
  }
} 