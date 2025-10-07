import { NextRequest, NextResponse } from 'next/server';
import sendQAReplyEmailEnhanced from '@/lib/email-service-enhanced';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email service with recipient:', to);

    const result = await sendQAReplyEmailEnhanced({
      to: to,
      customerName: 'Test Customer',
      originalQuestion: 'This is a test question to verify the email system is working properly. Can you confirm that emails are being sent correctly?',
      adminReply: 'This is a test reply from the admin panel. If you receive this email, the Q&A email system is working correctly!\n\nThe email includes:\n- Your original question\n- Our professional response\n- Complete contact information\n- Branded design\n\nBest regards,\nTrek Hub India Team',
      submissionDate: new Date().toISOString()
    });

    if (result.success) {
      console.log('✅ Test email sent successfully');
      return NextResponse.json(
        { message: 'Test email sent successfully', success: true },
        { status: 200 }
      );
    } else {
      console.error('❌ Failed to send test email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send test email', details: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Test email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
