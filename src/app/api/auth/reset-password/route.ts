import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Argon2id } from 'oslo/password';
import { logErrorToDB } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Get reset token and check if it's valid
    const { data: resetToken, error: tokenError } = await supabaseAdmin
      .from('password_reset_token')
      .select('*')
      .eq('id', token)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      // Delete expired token
      await supabaseAdmin
        .from('password_reset_token')
        .delete()
        .eq('id', token);

      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await new Argon2id().hash(password);

    // Update user's password
    const { error: updateError } = await supabaseAdmin
      .from('user_key')
      .update({ hashed_password: hashedPassword })
      .eq('user_id', resetToken.user_id);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Delete all sessions for this user (log out everywhere)
    await supabaseAdmin
      .from('user_session')
      .delete()
      .eq('user_id', resetToken.user_id);

    // Delete the used reset token
    await supabaseAdmin
      .from('password_reset_token')
      .delete()
      .eq('id', token);

    // Delete all other reset tokens for this user
    await supabaseAdmin
      .from('password_reset_token')
      .delete()
      .eq('user_id', resetToken.user_id);

    return NextResponse.json(
      { message: 'Password reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    await logErrorToDB(error, 'api/auth/reset-password POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 