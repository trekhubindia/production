import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    console.log('🔍 Debug: Session ID from cookie:', sessionId);

    if (!sessionId) {
      return NextResponse.json({
        hasSession: false,
        error: 'No session cookie found',
        cookieValue: null
      });
    }

    // Get session data
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('🔍 Debug: Session query result:', { 
      hasSession: !!session, 
      hasError: !!sessionError, 
      error: sessionError 
    });

    if (sessionError || !session) {
      return NextResponse.json({
        hasSession: false,
        error: 'Session not found in database',
        sessionId,
        sessionError: sessionError?.message
      });
    }

    console.log('🔍 Debug: Session data:', {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
      activity_log: session.activity_log
    });

    // Check if session is expired
    const isExpired = new Date(session.expires_at) < new Date();
    console.log('🔍 Debug: Session expired:', isExpired);

    if (isExpired) {
      return NextResponse.json({
        hasSession: false,
        error: 'Session expired',
        sessionId,
        expiresAt: session.expires_at,
        currentTime: new Date().toISOString()
      });
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email, created_at')
      .eq('id', session.user_id)
      .single();

    console.log('🔍 Debug: User data:', {
      id: user?.id,
      email: user?.email,
      hasError: !!userError,
      error: userError?.message
    });

    return NextResponse.json({
      hasSession: true,
      sessionId,
      userId: session.user_id,
      expiresAt: session.expires_at,
      isExpired,
      user: user || null,
      userError: userError?.message,
      activityLog: session.activity_log || []
    });

  } catch (error) {
    console.error('🔍 Debug: Session status error:', error);
    return NextResponse.json({
      hasSession: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
} 