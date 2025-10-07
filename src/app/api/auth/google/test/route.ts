import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    // Test database connection
    console.log('🧪 Testing Google OAuth database setup...');
    
    // Check if auth_user table exists and is accessible
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email, provider, created_at')
      .limit(5);

    // Check if user_session table exists and is accessible
    const { data: sessions, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('id, user_id, created_at')
      .limit(5);

    // Test environment variables
    const envCheck = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing',
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'Missing',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      database: {
        auth_user: {
          accessible: !authError,
          error: authError?.message,
          count: authUsers?.length || 0,
          sample: authUsers?.slice(0, 2) || []
        },
        user_session: {
          accessible: !sessionError,
          error: sessionError?.message,
          count: sessions?.length || 0,
          sample: sessions?.slice(0, 2) || []
        }
      },
      environment: envCheck,
      oauth_urls: {
        login: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google`,
        callback: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/google/callback`
      }
    });

  } catch (error) {
    console.error('❌ Google OAuth test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
