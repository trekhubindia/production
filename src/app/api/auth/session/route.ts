import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Update last activity and add session check activity
    const currentActivities = session.activity_log || [];
    const newActivity = {
      timestamp: new Date().toISOString(),
      type: 'session_check',
      data: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
    };

    await supabaseAdmin
      .from('user_session')
      .update({
        last_activity: new Date().toISOString(),
        activity_log: [...currentActivities, newActivity]
      })
      .eq('id', sessionId);

    // --- Optimization: fetch all user data in parallel ---
    const userId = session.user_id;
    const [userRes, profileRes, roleRes] = await Promise.all([
      supabaseAdmin.from('auth_user').select('id, email, provider, created_at, updated_at').eq('id', userId).single(),
      supabaseAdmin.from('user_profiles').select('*').eq('user_id', userId).single(),
      supabaseAdmin.from('user_roles').select('*').eq('user_id', userId).order('assigned_at', { ascending: false }).limit(1).single(),
    ]);
    const user = userRes.data;
    const profile = profileRes.data;
    const role = roleRes.data;

    // Log role status for debugging
    if (roleRes.error) {
      console.log(`Role query error for user ${userId}:`, roleRes.error);
    }
    console.log(`User ${userId} role status:`, role ? { is_active: role.is_active, role: role.role } : 'No role record');

    if (!user) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    // Check if user is banned - only if we have a role record and it's explicitly set to inactive
    if (role && role.is_active === false) {
      console.log(`User ${user.id} is banned, logging out`);
      // Delete session for banned user
      await supabaseAdmin
        .from('user_session')
        .delete()
        .eq('id', sessionId);

      // Clear session cookie
      cookieStore.set('auth_session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });

      return NextResponse.json(
        { user: null, error: 'Account suspended' },
        { status: 200 }
      );
    }

    // If no role record exists, assume user is active (default behavior)
    // This prevents false positives when role records are missing

    // Additional safety check: if role query failed but user exists, still allow access
    // This prevents users from being logged out due to database issues
    if (roleRes.error && !role) {
      console.log(`Role query failed for user ${userId}, but allowing access as fallback`);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: profile?.name || 'User',
          username: profile?.username || `user_${user.id.substring(0, 8)}`,
          role: role?.role || 'user',
          avatar_url: profile?.avatar_url,
        },
        session: {
          id: sessionId,
          expires_at: session.expires_at,
          last_activity: session.last_activity,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 