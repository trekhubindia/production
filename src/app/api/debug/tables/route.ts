import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check user_profiles table structure
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1);

    // Check auth_user table structure  
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .limit(1);

    return NextResponse.json({
      user_profiles: {
        sample_data: profiles?.[0] || null,
        columns: profiles?.[0] ? Object.keys(profiles[0]) : [],
        error: profilesError?.message
      },
      auth_user: {
        sample_data: authUsers?.[0] || null,
        columns: authUsers?.[0] ? Object.keys(authUsers[0]) : [],
        error: authError?.message
      }
    });

  } catch (error) {
    console.error('Debug tables error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
