import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getCompleteUserData } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({
        error: 'No session found',
        hasSession: false
      });
    }

    console.log('🔍 Debug: Checking session ID:', sessionId);

    // Get session with all details
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
        error: 'Invalid session',
        sessionError: sessionError?.message,
        hasSession: false
      });
    }

    console.log('🔍 Debug: Session data:', {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
      activity_log: session.activity_log
    });

    // Get complete user data using the new utility function
    const user = await getCompleteUserData(session.user_id);
    if (!user) {
      return NextResponse.json({
        error: 'User not found',
        hasSession: true,
        sessionData: session
      });
    }

    console.log('🔍 Debug: User data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_activated: user.is_activated
    });

    // Check session activity for login
    const activityLog = session.activity_log || [];
    
    // Look for login activity in this session
    const hasLoginInSession = activityLog.some((activity: { type?: string }) => activity.type === 'login');

    // Check if user should be redirected
    let shouldRedirect = null;
    let redirectReason = null;

    if (!user.is_activated) {
      shouldRedirect = '/auth/activate';
      redirectReason = 'User account not activated';
    }

    const canAccessAdmin = user.is_activated;

    return NextResponse.json({
      success: true,
      debug: {
        sessionId,
        timestamp: new Date().toISOString()
      },
      session: {
        id: session.id,
        user_id: session.user_id,
        expires_at: session.expires_at,
        isExpired: new Date(session.expires_at) < new Date(),
        activity_log: activityLog,
        activity_types: activityLog.map((a: { type?: string }) => a.type)
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_activated: user.is_activated,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      analysis: {
        hasSession: true,
        hasUser: true,
        isActivated: user.is_activated,
        hasLoginInSession,
        canAccessAdmin,
        shouldRedirect,
        redirectReason,
        middlewareDecision: shouldRedirect ? `Redirect to ${shouldRedirect}` : 'Allow access'
      }
    });

  } catch (error) {
    console.error('🔍 Debug: User details error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      hasSession: false
    });
  }
} 