import { NextResponse } from 'next/server';
import { discovery, authorizationCodeGrant, fetchUserInfo } from 'openid-client';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';
import { randomUUID } from 'crypto';

export async function GET(request) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const REDIRECT_URI = `${BASE_URL}/api/auth/google/callback`;

  // Parse code and state from query
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/auth?error=missing_code`);
  }

  // Discover Google's OpenID configuration
  const config = await discovery(
    new URL('https://accounts.google.com'),
    GOOGLE_CLIENT_ID,
    {
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uris: [REDIRECT_URI],
      response_types: ['code'],
    }
  );

  // Exchange code for tokens
  let tokenSet;
  try {
    tokenSet = await authorizationCodeGrant(
      config,
      new URL(request.url),
      { expectedState: state }
    );
    console.log('OAuth tokenSet:', tokenSet);
  } catch (err) {
    console.error('Token exchange error:', err);
    return NextResponse.redirect(`${BASE_URL}/auth?error=token_exchange_failed`);
  }

  // Decode id_token to get subject
  let expectedSubject = "";
  if (tokenSet.id_token) {
    try {
      const decoded = decodeJwt(tokenSet.id_token);
      expectedSubject = decoded.sub || "";
    } catch (err) {
      console.error('Error decoding id_token:', err);
    }
  }
  if (!expectedSubject) {
    console.error('No subject found in id_token');
    return NextResponse.redirect(`${BASE_URL}/auth?error=userinfo_failed`);
  }

  // Fetch user info
  let userInfo;
  try {
    userInfo = await fetchUserInfo(config, tokenSet.access_token, expectedSubject);
    console.log('✅ User info fetched successfully:', {
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      sub: userInfo.sub
    });
  } catch (err) {
    console.error('❌ User info fetch error:', err);
    return NextResponse.redirect(`${BASE_URL}/auth?error=userinfo_failed`);
  }

  // Check if user exists and provider matches
  console.log('🔍 Checking for existing user with email:', userInfo.email);
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('auth_user')
    .select('id, provider')
    .eq('email', userInfo.email)
    .single();

  if (existingUserError && existingUserError.code !== 'PGRST116') {
    console.error('❌ Error checking existing user:', existingUserError);
  }

  console.log('👤 Existing user check result:', {
    found: !!existingUser,
    existingUser,
    error: existingUserError?.code
  });

  let userId = existingUser?.id || randomUUID();

  // UUID validation helper
  function isValidUUID(uuid) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
  }
  if (!isValidUUID(userId)) {
    userId = randomUUID();
  }

  if (existingUser && existingUser.provider !== 'google') {
    return NextResponse.redirect(`${BASE_URL}/auth?error=registered_with_different_method`);
  }

  console.log('💾 Attempting to upsert Google OAuth user with data:', {
    id: userId,
    email: userInfo.email,
    provider: 'google',
  });

  // Step 1: Upsert user into auth_user table (basic auth info)
  // Your auth_user table has: id, email, provider, created_at, updated_at
  const { data: user, error: userError } = await supabaseAdmin
    .from('auth_user')
    .upsert({
      id: userId,
      email: userInfo.email,
      provider: 'google',
    }, { onConflict: 'email' })
    .select()
    .single();

  console.log('💾 Upsert result:', {
    success: !!user,
    user: user ? { id: user.id, email: user.email, provider: user.provider } : null,
    error: userError
  });

  if (userError || !user) {
    console.error('❌ User upsert error:', userError);
    console.error('❌ Full error details:', JSON.stringify(userError, null, 2));
    return NextResponse.redirect(`${BASE_URL}/auth?error=user_upsert_failed&details=${encodeURIComponent(userError?.message || 'Unknown error')}`);
  }

  console.log('✅ User successfully created/updated:', {
    id: user.id,
    email: user.email,
    provider: user.provider
  });

  // Step 2: Create/update user profile in user_profiles table
  console.log('👤 Creating/updating user profile...');
  const { data: existingProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!existingProfile) {
    // Create new profile for OAuth user
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: user.id,
        name: userInfo.name || userInfo.email.split('@')[0], // Use name or email prefix
        avatar_url: userInfo.picture || null,
        // Add any other profile fields your table has
      })
      .select()
      .single();

    if (profileError) {
      console.error('⚠️  Error creating user profile:', profileError);
      // Don't fail the OAuth flow for profile creation issues
    } else {
      console.log('✅ User profile created:', { user_id: user.id, name: profile.name });
    }
  } else {
    // Update existing profile with Google data
    const { error: updateProfileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        name: userInfo.name || userInfo.email.split('@')[0],
        avatar_url: userInfo.picture || null,
      })
      .eq('user_id', user.id);

    if (updateProfileError) {
      console.error('⚠️  Error updating user profile:', updateProfileError);
    } else {
      console.log('✅ User profile updated:', { user_id: user.id });
    }
  }

  // Handle user activation for OAuth users (since Google has verified their email)
  console.log('🔓 Setting up user activation for OAuth user...');
  const { data: existingActivation, error: activationCheckError } = await supabaseAdmin
    .from('user_activation')
    .select('id, is_activated')
    .eq('user_id', user.id)
    .single();

  if (activationCheckError && activationCheckError.code !== 'PGRST116') {
    console.error('⚠️  Error checking user activation:', activationCheckError);
  }

  if (!existingActivation) {
    // Create activation record for new OAuth user
    // Your schema has: id, user_id, activation_token, is_activated, activated_at, expires_at, created_at, updated_at
    const { data: activation, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .insert({
        user_id: user.id,
        activation_token: randomUUID(), // Generate token for consistency
        is_activated: true, // OAuth users are pre-activated
        activated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      })
      .select()
      .single();

    if (activationError) {
      console.error('❌ Error creating user activation:', activationError);
    } else {
      console.log('✅ User activation created:', { user_id: user.id, is_activated: true });
    }
  } else if (!existingActivation.is_activated) {
    // Update existing activation to true for OAuth login
    const { error: updateActivationError } = await supabaseAdmin
      .from('user_activation')
      .update({
        is_activated: true,
        activated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (updateActivationError) {
      console.error('❌ Error updating user activation:', updateActivationError);
    } else {
      console.log('✅ User activation updated:', { user_id: user.id, is_activated: true });
    }
  } else {
    console.log('✅ User already activated:', { user_id: user.id, is_activated: true });
  }

  // Check if user already has a session
  console.log('🔍 Checking for existing session for user:', user.id);
  const { data: existingSession, error: sessionCheckError } = await supabaseAdmin
    .from('user_session')
    .select('id, activity_log')
    .eq('user_id', user.id)
    .single();

  console.log('📋 Session check result:', {
    found: !!existingSession,
    sessionId: existingSession?.id,
    error: sessionCheckError?.code
  });

  let sessionId;
  const newActivity = {
    timestamp: new Date().toISOString(),
    type: existingSession ? 'oauth_login' : 'session_created',
    data: { provider: 'google', email: userInfo.email }
  };
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existingSession) {
    // Update existing session
    sessionId = existingSession.id;
    const updatedLog = Array.isArray(existingSession.activity_log)
      ? [...existingSession.activity_log, newActivity]
      : [newActivity];
    const { error: updateError } = await supabaseAdmin
      .from('user_session')
      .update({
        expires_at: expiresAt,
        last_activity: new Date().toISOString(),
        activity_log: updatedLog
      })
      .eq('user_id', user.id);
    if (updateError) {
      console.error('Session update error:', updateError);
      return NextResponse.redirect(`${BASE_URL}/auth?error=session_update_failed`);
    }
  } else {
    // Create new session
    sessionId = randomUUID();
    const { error: sessionError } = await supabaseAdmin
      .from('user_session')
      .insert({
        id: sessionId,
        user_id: user.id,
        expires_at: expiresAt,
        last_activity: new Date().toISOString(),
        activity_log: [newActivity]
      });
    if (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.redirect(`${BASE_URL}/auth?error=session_failed`);
    }
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

  // Redirect to homepage with success parameter
  return NextResponse.redirect(`${BASE_URL}/?auth_success=true`);
} 