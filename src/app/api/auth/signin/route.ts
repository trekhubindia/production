import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Argon2id } from 'oslo/password';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { logErrorToDB } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user and key in parallel
    const [userRes, keyRes] = await Promise.all([
      supabaseAdmin
        .from('auth_user')
        .select('*')
        .eq('email', email)
        .single(),
      supabaseAdmin
        .from('user_key')
        .select('hashed_password')
        .eq('id', `email:${email}`)
        .single()
    ]);

    const { data: user, error: userError } = userRes;
    const { data: key, error: keyError } = keyRes;

    if (userError || !user || keyError || !key) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const validPassword = await new Argon2id().verify(key.hashed_password, password);
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is banned - only if we have a role record and it's explicitly set to inactive
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('is_active')
      .eq('user_id', user.id)
      .single();

    // Only ban if we have a role record and it's explicitly set to inactive
    if (userRole && userRole.is_active === false) {
      console.log(`Login attempt by banned user ${user.id}`);
      return NextResponse.json(
        { error: 'Account suspended. Please contact support for assistance.' },
        { status: 403 }
      );
    }

    // If no role record exists or roleError, assume user is active (default behavior)
    // This prevents false positives when role records are missing

    // Always delete all old sessions for this user before creating a new one
    await supabaseAdmin
      .from('user_session')
      .delete()
      .eq('user_id', user.id);

    // Create new session
    const sessionId = randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const newActivity = {
      timestamp: now.toISOString(),
      type: 'email_login',
      data: { email: user.email }
    };
    const { error: sessionError } = await supabaseAdmin
      .from('user_session')
      .insert({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt,
        last_activity: now.toISOString(),
        activity_log: [{
          timestamp: now.toISOString(),
          type: 'session_created',
          data: { email: user.email }
        }, newActivity]
      })
      .select()
      .single();
    if (sessionError) {
      console.error('Error creating session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session: ' + sessionError.message },
        { status: 500 }
      );
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' ? true : false,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    // Get complete user data
    const completeUser = await import('@/lib/auth-utils').then(m => m.getCompleteUserData(user.id));

    return NextResponse.json(
      { 
        message: 'Signed in successfully',
        session_id: sessionId, // Add session_id for mobile app
        user: completeUser
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Signin error:', error);
    await logErrorToDB(error, 'api/auth/signin POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 