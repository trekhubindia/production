import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: 'Lucia mock configuration loaded successfully',
      timestamp: new Date().toISOString(),
      note: 'This is a mock implementation. Real Lucia configuration will be added later.',
      config: {
        type: 'mock',
        sessionCookie: 'auth_session'
      }
    });
  } catch (error) {
    console.error('Lucia test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
