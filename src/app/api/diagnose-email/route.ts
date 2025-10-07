import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'Missing',
      GMAIL_USER: process.env.GMAIL_USER || 'Missing',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'Present' : 'Missing',
    },
    recommendations: []
  };

  // Check Resend configuration
  if (!process.env.RESEND_API_KEY) {
    diagnostics.recommendations.push({
      issue: 'Missing Resend API Key',
      solution: 'Add RESEND_API_KEY to your .env.local file. Get it from https://resend.com/api-keys'
    });
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    diagnostics.recommendations.push({
      issue: 'Missing Resend From Email',
      solution: 'Add RESEND_FROM_EMAIL to your .env.local file (e.g., noreply@yourdomain.com)'
    });
  } else if (process.env.RESEND_FROM_EMAIL === 'noreply@nomadictravels.shop') {
    diagnostics.recommendations.push({
      issue: 'Domain not verified',
      solution: 'The domain nomadictravels.shop may not be verified in your Resend account. Either verify it or use a verified domain.'
    });
  }

  // Check Gmail configuration
  if (process.env.GMAIL_USER === 'your_gmail_address@gmail.com' || !process.env.GMAIL_USER) {
    diagnostics.recommendations.push({
      issue: 'Gmail not configured',
      solution: 'Configure Gmail as a fallback by setting GMAIL_USER and GMAIL_APP_PASSWORD in .env.local'
    });
  }

  if (!process.env.GMAIL_APP_PASSWORD) {
    diagnostics.recommendations.push({
      issue: 'Missing Gmail App Password',
      solution: 'Generate a Gmail App Password at https://myaccount.google.com/apppasswords and add it to GMAIL_APP_PASSWORD'
    });
  }

  // Add general recommendations
  if (diagnostics.recommendations.length === 0) {
    diagnostics.recommendations.push({
      issue: 'Configuration looks good',
      solution: 'Your email configuration appears correct. If emails are not being delivered, check your spam folder or email service logs.'
    });
  }

  return NextResponse.json(diagnostics, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, testType = 'basic' } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Test with a simple email first
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('🧪 Testing direct Resend API call...');
    console.log('   To:', to);
    console.log('   From:', process.env.RESEND_FROM_EMAIL);

    try {
      const result = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: to,
        subject: 'Test Email - Trek Hub India',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email to verify your email configuration is working.</p>
          <p>If you receive this email, your Resend configuration is correct!</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `,
        text: `Test Email - If you receive this email, your Resend configuration is correct! Sent at: ${new Date().toISOString()}`
      });

      if (result.error) {
        console.error('❌ Resend API error:', result.error);
        return NextResponse.json({
          success: false,
          error: result.error.message,
          details: result.error
        }, { status: 400 });
      }

      console.log('✅ Direct Resend API call successful:', result.data?.id);
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully via Resend',
        emailId: result.data?.id,
        method: 'resend'
      });

    } catch (error) {
      console.error('❌ Direct Resend API call failed:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Diagnostic test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
