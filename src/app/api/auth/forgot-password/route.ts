import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { randomUUID } from 'crypto';
import { emailService } from '@/lib/email-service';
import { logErrorToDB } from '@/lib/error-logger';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log('[ForgotPassword] Step 1: Received request for email:', email, 'from IP:', ip);

    if (!email) {
      console.log('[ForgotPassword] Step 2: No email provided');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists and provider is password
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email, provider')
      .eq('email', email)
      .single();
    console.log('[ForgotPassword] Step 3: User lookup result', { user, userError });

    if (userError || !user) {
      console.log('[ForgotPassword] Step 4: User not found or error');
      return NextResponse.json(
        { error: 'No account found with this email.' },
        { status: 404 }
      );
    }

    if (user.provider && user.provider !== 'password') {
      return NextResponse.json(
        { error: 'This account uses a different login method. Please use that method to sign in.' },
        { status: 400 }
      );
    }

    // 1. Cooldown per request (60s)
    const { data: recentToken } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (recentToken && recentToken.created_at) {
      const lastRequest = new Date(recentToken.created_at).getTime();
      const now = Date.now();
      const cooldown = 60 - Math.floor((now - lastRequest) / 1000);
      if (now - lastRequest < 60 * 1000) {
        console.log('[ForgotPassword] Step 4.1: Cooldown active for user');
        return NextResponse.json(
          { message: 'Please wait before requesting another password reset email.', cooldown },
          { status: 429 }
        );
      }
    }

    // 2. Max requests per user/email (5 per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: userCount } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);
    if ((userCount ?? 0) >= 5) {
      console.log('[ForgotPassword] Step 4.2: User hourly limit reached');
      return NextResponse.json(
        { message: 'The password reset link has been sent to your email address.' },
        { status: 200 }
      );
    }

    // 3. Max requests per IP (15 per hour) - Skip if table doesn't exist
    try {
      const { count: ipCount } = await supabaseAdmin
        .from('password_reset_ip_log')
        .select('id', { count: 'exact', head: true })
        .eq('ip', ip)
        .gte('created_at', oneHourAgo);
      if ((ipCount ?? 0) >= 15) {
        console.log('[ForgotPassword] Step 4.3: IP hourly limit reached');
        return NextResponse.json(
          { message: 'The password reset link has been sent to your email address.' },
          { status: 200 }
        );
      }

      // Log this request by IP
      await supabaseAdmin
        .from('password_reset_ip_log')
        .insert({ ip });
    } catch (ipLogError) {
      console.log('[ForgotPassword] IP logging table not available, skipping IP limits:', ipLogError);
    }

    // 4. Expire all previous tokens for this user
    await supabaseAdmin
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id);

    // 5. Generate reset token (15 min expiry)
    const resetToken = randomUUID(); // instead of generateId(40)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes
    console.log('[ForgotPassword] Step 5: Generated reset token', { resetToken, expiresAt });

    // Store reset token
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        token: resetToken,
        user_id: user.id,
        expires_at: expiresAt,
      });
    console.log('[ForgotPassword] Step 6: Token insert result', { tokenError });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      console.error('Token insert details:', {
        token: resetToken,
        user_id: user.id,
        expires_at: expiresAt,
        error_code: tokenError.code,
        error_message: tokenError.message,
        error_details: tokenError.details
      });
      return NextResponse.json(
        { error: 'Failed to create reset token', details: tokenError.message },
        { status: 500 }
      );
    }

    // Create reset URL
    const resetUrl = `https://trekhubindia.com/reset-password?token=${resetToken}`;
    console.log('[ForgotPassword] Step 7: Reset URL created', { resetUrl });

    // Remove name from password reset email call
    // Send password reset email using new template
    try {
      console.log('[ForgotPassword] Step 8: About to send password reset email', { email, resetUrl });
      const emailResult = await emailService.sendPasswordResetEmail(
        email,
        resetUrl
      );
      console.log('[ForgotPassword] Step 9: Email service result:', emailResult);
      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
      }
    } catch (emailError: unknown) {
      console.error('Error sending password reset email:', emailError);
    }

    return NextResponse.json(
      { message: 'The password reset link has been sent to your email address.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    await logErrorToDB(error, 'api/auth/forgot-password POST');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 