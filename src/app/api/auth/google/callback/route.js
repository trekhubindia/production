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
  
  // Force localhost for development to avoid 0.0.0.0 issues
  const REDIRECT_URI = BASE_URL?.includes('0.0.0.0') 
    ? `http://localhost:3000/api/auth/google/callback`
    : `${BASE_URL}/api/auth/google/callback`;

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
      { 
        expectedState: state,
        redirect_uri: REDIRECT_URI // Explicitly specify redirect_uri
      }
    );
  } catch (err) {
    console.error('OAuth token exchange failed:', err.message);
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
  } catch (err) {
    console.error('User info fetch error:', err);
    return NextResponse.redirect(`${BASE_URL}/auth?error=userinfo_failed`);
  }

  // Check if user exists and provider matches
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from('auth_user')
    .select('id, provider')
    .eq('email', userInfo.email)
    .single();

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

  // Step 1: Upsert user into auth_user table (basic auth info)
  const { data: user, error: userError } = await supabaseAdmin
    .from('auth_user')
    .upsert({
      id: userId,
      email: userInfo.email,
      provider: 'google',
    }, { onConflict: 'email' })
    .select()
    .single();

  if (userError || !user) {
    console.error('User upsert error:', userError);
    return NextResponse.redirect(`${BASE_URL}/auth?error=user_upsert_failed`);
  }

  // Step 2: Create/update user profile in user_profiles table
  const { data: existingProfile } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!existingProfile) {
    // Create new profile for OAuth user
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: user.id,
        name: userInfo.name || userInfo.email.split('@')[0],
        avatar_url: userInfo.picture || null,
      });

    if (profileError) {
      console.error('Error creating user profile:', profileError);
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
      console.error('Error updating user profile:', updateProfileError);
    }
  }

  // Handle user activation for OAuth users (since Google has verified their email)
  const { data: existingActivation, error: activationCheckError } = await supabaseAdmin
    .from('user_activation')
    .select('id, is_activated')
    .eq('user_id', user.id)
    .single();

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
      console.error('Error creating user activation:', activationError);
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
      console.error('Error updating user activation:', updateActivationError);
    }
  }

  // Check if user already has a session
  const { data: existingSession, error: sessionCheckError } = await supabaseAdmin
    .from('user_session')
    .select('id, activity_log')
    .eq('user_id', user.id)
    .single();

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