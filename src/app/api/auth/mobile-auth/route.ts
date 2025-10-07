import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 400 });
    }

    // Verify the session token
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Invalid session token' }, { status: 401 });
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Get user data
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('id', session.user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user profile for name
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    // Set the auth_session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log(`📱 Mobile authentication successful for user ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Mobile authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: profile?.name || 'User',
      },
    });

  } catch (error) {
    console.error('Mobile authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Verify the session
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

    return NextResponse.json({ 
      success: true, 
      session: {
        id: session.id,
        user_id: session.user_id,
        expires_at: session.expires_at
      }
    });

  } catch (error) {
    console.error('Mobile auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
