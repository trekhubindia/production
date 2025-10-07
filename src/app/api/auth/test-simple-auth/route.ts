import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Create a simple test session
    const testSessionId = 'test-session-' + Date.now();
    
    // Set the auth_session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', testSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log(`📱 Simple test authentication successful`);

    return NextResponse.json({
      success: true,
      message: 'Simple test authentication successful',
      session: {
        id: testSessionId,
        user_id: 'test-user-id',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });

  } catch (error) {
    console.error('Simple test authentication error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'No session found',
        status: 'no_session'
      }, { status: 401 });
    }

    // For test sessions, always return success
    if (sessionId.startsWith('test-session-')) {
      return NextResponse.json({
        success: true,
        message: 'Test session is valid',
        session: {
          id: sessionId,
          user_id: 'test-user-id',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Invalid session',
      status: 'invalid_session'
    }, { status: 401 });

  } catch (error) {
    console.error('Simple test auth check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
