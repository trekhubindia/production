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

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const { user } = await validateUserSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
    }

    // Get current password hash from user_key table
    const { data: userKey, error: keyError } = await supabaseAdmin
      .from('user_key')
      .select('hashed_password')
      .eq('id', `email:${user.email}`)
      .single();

    if (keyError || !userKey) {
      return NextResponse.json({ error: 'User credentials not found' }, { status: 400 });
    }

    // Verify current password
    const isCurrentPasswordValid = await new Argon2id().verify(userKey.hashed_password, currentPassword);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const newPasswordHash = await new Argon2id().hash(newPassword);

    // Update password in user_key table
    const { error: updateError } = await supabaseAdmin
      .from('user_key')
      .update({ 
        hashed_password: newPasswordHash
      })
      .eq('id', `email:${user.email}`);

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // Log the password change activity
    const { data: session } = await supabaseAdmin
      .from('user_session')
      .select('activity_log')
      .eq('user_id', user.id)
      .single();

    if (session) {
      const currentActivities = session.activity_log || [];
      const newActivity = {
        timestamp: new Date().toISOString(),
        type: 'password_change',
        data: { ip: request.headers.get('x-forwarded-for') || 'unknown' }
      };

      await supabaseAdmin
        .from('user_session')
        .update({
          activity_log: [...currentActivities, newActivity]
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
