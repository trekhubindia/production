import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function validateUserSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    console.log('Session validation - sessionId:', sessionId ? 'present' : 'missing');

    if (!sessionId) {
      console.log('No session ID found in cookies');
      return { user: null };
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    console.log('Session query result:', { session: !!session, error: sessionError?.message });

    if (sessionError || !session) {
      console.log('Session not found or error:', sessionError?.message);
      return { user: null };
    }

    if (new Date(session.expires_at) < new Date()) {
      console.log('Session expired:', session.expires_at);
      return { user: null };
    }

    // Get user from auth_user table (basic info)
    const { data: authUser, error: authUserError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('id', session.user_id)
      .single();

    console.log('Auth user query result:', { user: !!authUser, error: authUserError?.message });

    if (authUserError || !authUser) {
      console.log('Auth user not found or error:', authUserError?.message);
      return { user: null };
    }

    // Get user profile for additional info like name
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('name')
      .eq('user_id', session.user_id)
      .single();

    console.log('Profile query result:', { profile: !!profile, error: profileError?.message });

    // Combine auth user and profile data
    const user = {
      id: authUser.id,
      email: authUser.email,
      name: profile?.name || 'User'
    };

    console.log('Session validation successful for user:', user.id);
    return { user };
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null };
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, dateOfBirth, gender, address } = body;
    // Note: email is locked and cannot be changed via profile update

    // First, check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('username')
      .eq('user_id', user.id)
      .single();

    let updatedProfile, error;

    if (existingProfile) {
      // Update existing profile (don't change username)
      const result = await supabaseAdmin
        .from('user_profiles')
        .update({
          name: name || null,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          location: address || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      updatedProfile = result.data;
      error = result.error;
    } else {
      // Create new profile with username
      const username = `user_${user.id.substring(0, 8)}`;
      const result = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: user.id,
          username: username,
          name: name || null,
          phone: phone || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          location: address || null,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      updatedProfile = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // Email is locked and cannot be changed via profile update
    // Email changes would require a separate secure process with verification

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from database
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // If no profile exists, return user data from auth
    if (!profile) {
      return NextResponse.json({
        profile: {
          user_id: user.id,
          name: user.name || '',
          email: user.email || '',
          phone: '',
          date_of_birth: '',
          gender: '',
          address: '' // We'll map location to address for frontend compatibility
        }
      });
    }

    // Map database fields to frontend expected fields
    const mappedProfile = {
      ...profile,
      address: profile.location || '' // Map location to address for frontend
    };

    return NextResponse.json({ profile: mappedProfile });

  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
