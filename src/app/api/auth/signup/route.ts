import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Argon2id } from 'oslo/password';
import { emailService } from '@/lib/email-service';
import { randomUUID } from 'crypto';
import { logErrorToDB } from '@/lib/error-logger';
import { checkUserExists, createNewUser, debugUserRecords } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { exists, user: existingUser } = await checkUserExists(email);

    if (exists && existingUser) {
      if (existingUser.provider !== 'password') {
        return NextResponse.json(
          { error: 'User already registered with a different method' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await new Argon2id().hash(password);

    // Create user with all related records
    const userId = randomUUID();
    console.log('Creating user with ID:', userId);
    
    const { success, error: createError, user } = await createNewUser({
        id: userId,
        email,
        name,
      provider: 'password',
        is_activated: false,
    });

    if (!success || !user) {
      console.error('Error creating user:', createError);
      
      // Debug: Check what records were actually created
      const debugInfo = await debugUserRecords(userId);
      console.error('Debug info for failed user creation:', debugInfo);
      
      return NextResponse.json(
        { error: 'Failed to create user: ' + (createError || 'Unknown error') },
        { status: 500 }
      );
    }

    console.log('User created successfully:', user);

    // Create user key (password)
    console.log('Creating user key for user ID:', userId);
    
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from('user_key')
      .insert({
        id: `email:${email}`,
        user_id: userId,
        hashed_password: hashedPassword,
      })
      .select()
      .single();

    if (keyError) {
      console.error('Error creating user key:', keyError);
      console.error('Key creation error details:', {
        code: keyError.code,
        message: keyError.message,
        details: keyError.details,
        hint: keyError.hint
      });
      return NextResponse.json(
        { error: 'Failed to create user credentials: ' + keyError.message },
        { status: 500 }
      );
    }

    console.log('User key created successfully:', keyData);

    // Create session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('user_session')
      .insert({
        id: sessionId,
        user_id: userId,
        expires_at: expiresAt,
        last_activity: new Date().toISOString(),
        activity_log: [{
          timestamp: new Date().toISOString(),
          type: 'signup',
          data: { email }
        }]
      });

    // Get activation token from user_activation table
    const { data: activationData, error: activationError } = await supabaseAdmin
      .from('user_activation')
      .select('activation_token')
      .eq('user_id', userId)
      .single();

    if (activationError) {
      console.error('Error getting activation token:', activationError);
      return NextResponse.json(
        { error: 'Failed to get activation token' },
        { status: 500 }
      );
    }

    // Send activation email
    const activationUrl = `https://trekhubindia.com/auth/activate?token=${activationData.activation_token}`;
    await emailService.sendActivationEmail(email, activationUrl, name);

    // Get complete user data
    const completeUser = await import('@/lib/auth-utils').then(m => m.getCompleteUserData(user.id));

    return NextResponse.json(
      { 
        message: 'User created successfully. Please check your email to activate your account.',
        session_id: sessionId, // Add session_id for mobile app
        user: completeUser
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    await logErrorToDB(error, 'api/auth/signup POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 