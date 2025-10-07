import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    // Get user from session (same method as dashboard APIs)
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user session
    const { data: sessionData } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data
    const { data: userData } = await supabaseAdmin
      .from('auth_user')
      .select('*')
      .eq('id', sessionData.user_id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = userData.id;

    // Query user_profiles table
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Combine profile data with auth user data
    const combinedProfile = {
      // From auth_user table (primary source for email)
      email: userData.email,
      
      // From user_profiles table (detailed profile info)
      user_id: userId,
      full_name: userProfile?.name, // user_profiles.name maps to full_name
      name: userProfile?.name,
      username: userProfile?.username,
      phone: userProfile?.phone,
      date_of_birth: userProfile?.date_of_birth,
      gender: userProfile?.gender,
      bio: userProfile?.bio,
      location: userProfile?.location,
      website: userProfile?.website,
      avatar_url: userProfile?.avatar_url,
      created_at: userProfile?.created_at,
      updated_at: userProfile?.updated_at
    };

    return NextResponse.json({ 
      success: true, 
      profile: combinedProfile,
      has_profile: !!userProfile,
      has_auth_data: !!userData
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 