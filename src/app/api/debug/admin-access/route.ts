import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({
        error: 'No session found',
        sessionId: null,
        user: null,
        session: null
      });
    }

    // Get session
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({
        error: 'Invalid session',
        sessionId,
        user: null,
        session: null
      });
    }

    // Get user
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email, name')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found',
        sessionId,
        user: null,
        session
      });
    }

    const activityLog = session.activity_log || [];

    return NextResponse.json({
      sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      session: {
        id: session.id,
        user_id: session.user_id,
        expires_at: session.expires_at,
        last_activity: session.last_activity,
        activity_log: activityLog
      },
      activityLog
    });

  } catch (error) {
    console.error('Debug admin access error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 