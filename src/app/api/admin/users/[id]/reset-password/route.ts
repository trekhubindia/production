import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { canUserAccessAdmin } from '@/lib/admin-auth-utils';
import { supabaseAdmin } from '@/lib/supabase';
import { sendPasswordResetEmail } from '@/lib/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('auth_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const authResult = await canUserAccessAdmin(sessionId);
    if (!authResult.canAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: userId } = await params;

    // Get user details
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth_user')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Check if password_reset_tokens table exists
    try {
      const { error: tableCheckError } = await supabaseAdmin
        .from('password_reset_tokens')
        .select('id')
        .limit(1);

      if (tableCheckError) {
        console.error('Password reset tokens table error:', tableCheckError);
        return NextResponse.json({ 
          error: 'Password reset functionality not available',
          details: 'The password_reset_tokens table is not set up. Please run the database migration first.'
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error checking password_reset_tokens table:', error);
      return NextResponse.json({ 
        error: 'Password reset functionality not available',
        details: 'Database setup issue. Please run the database migration.'
      }, { status: 500 });
    }

    // Store reset token in database
    const { error: tokenError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('Error creating reset token:', tokenError);
      return NextResponse.json({ 
        error: 'Failed to create reset token',
        details: tokenError.message || 'Database error'
      }, { status: 500 });
    }

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://nomadictravels.shop'}/reset-password?token=${resetToken}`;
    
    // Log environment variables for debugging (remove in production)
    console.log('Email service debug:', {
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasFromEmail: !!process.env.RESEND_FROM_EMAIL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      userEmail: user.email,
      resetUrl: resetUrl
    });
    
    try {
      const emailResult = await sendPasswordResetEmail(user.email, resetUrl);
      if (!emailResult.success) {
        console.error('Email service error:', emailResult.error);
        return NextResponse.json({ 
          error: 'Failed to send reset email',
          details: emailResult.error || 'Email service error'
        }, { status: 500 });
      }
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send reset email',
        details: emailError instanceof Error ? emailError.message : 'Unknown email error'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Password reset link sent successfully',
      email: user.email 
    });

  } catch (error) {
    console.error('Error in password reset API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 