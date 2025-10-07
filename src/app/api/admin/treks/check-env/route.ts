import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    return NextResponse.json({
      success: true,
      environment: {
        supabaseUrl: !!supabaseUrl,
        supabaseAnonKey: !!supabaseAnonKey,
        supabaseServiceKey: !!supabaseServiceKey,
        hasServiceKey: !!supabaseServiceKey
      },
      message: supabaseServiceKey 
        ? 'Service role key is available' 
        : 'Service role key is missing - add SUPABASE_SERVICE_ROLE_KEY to your .env.local'
    });
    
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({ 
      error: 'Environment check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 