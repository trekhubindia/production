import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword';
    const testName = 'Test User';

    // Check if test user already exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('email', testEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check existing user',
        status: 'db_error'
      }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ 
        success: true,
        message: 'Test user already exists',
        user: {
          id: existingUser.id,
          email: existingUser.email,
          name: testName,
        },
        status: 'user_exists'
      });
    }

    // Generate user ID
    const userId = randomUUID();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // Create test user in auth_user table
    const { data: newUser, error: createUserError } = await supabaseAdmin
      .from('auth_user')
      .insert({
        id: userId,
        email: testEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        provider: 'password'
      })
      .select()
      .single();

    if (createUserError) {
      console.error('Error creating auth_user:', createUserError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create auth user',
        status: 'db_error',
        details: createUserError.message
      }, { status: 500 });
    }

    // Create user key for password authentication
    const { error: createKeyError } = await supabaseAdmin
      .from('user_key')
      .insert({
        id: `email:${testEmail}`,
        user_id: userId,
        hashed_password: hashedPassword,
        created_at: new Date().toISOString()
      });

    if (createKeyError) {
      console.error('Error creating user_key:', createKeyError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create user key',
        status: 'db_error',
        details: createKeyError.message
      }, { status: 500 });
    }

    // Create user profile
    const { error: createProfileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userId,
        username: 'testuser',
        name: testName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (createProfileError) {
      console.error('Error creating user_profile:', createProfileError);
      // Don't fail here, profile is optional
    }

    console.log(`📱 Test user created: ${newUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Test user created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: testName,
      },
      credentials: {
        email: testEmail,
        password: testPassword,
      },
      status: 'user_created'
    });

  } catch (error) {
    console.error('Create test user error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      status: 'server_error'
    }, { status: 500 });
  }
}
