import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    console.log('Debug session - sessionId:', sessionId);
    console.log('All cookies:', cookieStore.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })));

    if (!sessionId) {
      return NextResponse.json({ 
        error: 'No session cookie found',
        cookies: cookieStore.getAll().map(c => c.name)
      });
    }

    // Check if session exists in database
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return NextResponse.json({ 
        error: 'Session query failed',
        sessionError: sessionError.message,
        sessionId: sessionId
      });
    }

    if (!session) {
      return NextResponse.json({ 
        error: 'Session not found in database',
        sessionId: sessionId
      });
    }

    // Check if session is expired
    const isExpired = new Date(session.expires_at) < new Date();
    
    return NextResponse.json({
      sessionId: sessionId,
      session: {
        user_id: session.user_id,
        expires_at: session.expires_at,
        is_expired: isExpired,
        last_activity: session.last_activity
      }
    });

  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
