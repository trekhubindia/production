import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Argon2id } from 'oslo/password';

async function validateUserSession() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return { user: null };
    }

    const { data: session, error: sessionError } = await supabaseAdmin
      .from('user_session')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { user: null };
    }

    if (new Date(session.expires_at) < new Date()) {
      return { user: null };
    }

    const { data: authUser, error: authUserError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('id', session.user_id)
      .single();

    if (authUserError || !authUser) {
      return { user: null };
    }

    return { user: authUser };
  } catch (error) {
    console.error('Session validation error:', error);
    return { user: null };
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    // Validate input
    if (!password) {
      return NextResponse.json({ error: 'Password is required to delete account' }, { status: 400 });
    }

    // Get password hash from user_key table
    const { data: userKey, error: keyError } = await supabaseAdmin
      .from('user_key')
      .select('hashed_password')
      .eq('id', `email:${user.email}`)
      .single();

    if (keyError || !userKey) {
      return NextResponse.json({ error: 'User credentials not found' }, { status: 400 });
    }

    // Verify password
    const isPasswordValid = await new Argon2id().verify(userKey.hashed_password, password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password is incorrect' }, { status: 400 });
    }

    // Delete user data in the correct order (due to foreign key constraints)
    
    // 1. Delete user sessions
    await supabaseAdmin
      .from('user_session')
      .delete()
      .eq('user_id', user.id);

    // 2. Delete user profile
    await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('user_id', user.id);

    // 3. Delete user roles
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', user.id);

    // 4. Delete user activation records
    await supabaseAdmin
      .from('user_activation')
      .delete()
      .eq('user_id', user.id);

    // 5. Delete bookings (if any)
    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('user_id', user.id);

    // 6. Delete wishlists (if any)
    await supabaseAdmin
      .from('wishlists')
      .delete()
      .eq('user_id', user.id);

    // 7. Delete user key (password)
    await supabaseAdmin
      .from('user_key')
      .delete()
      .eq('id', `email:${user.email}`);

    // 8. Finally, delete the auth user record
    const { error: deleteError } = await supabaseAdmin
      .from('auth_user')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      console.error('Account deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return NextResponse.json({
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
