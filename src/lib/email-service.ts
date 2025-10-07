import { Resend, CreateEmailOptions } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}
if (!resendFromEmail || typeof resendFromEmail !== 'string') {
  throw new Error('RESEND_FROM_EMAIL environment variable must be a non-empty string');
}

const resend = new Resend(resendApiKey);

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  if (!to || typeof to !== 'string') {
    throw new Error('Recipient email address (to) must be a non-empty string');
  }
  if (!subject || typeof subject !== 'string') {
    throw new Error('Email subject must be a non-empty string');
  }
  if (!html && !text) {
    throw new Error('At least one of html or text must be provided for the email.');
  }
  try {
    // Only include html/text if defined
    const emailOptions = {
      from: resendFromEmail as string,
      to: to as string,
      subject: subject as string,
      ...(html ? { html } : {}),
      ...(text ? { text } : {})
    } as CreateEmailOptions;
    const result = await resend.emails.send(emailOptions);
    if (result.error) {
      console.error('Resend error:', result.error);
      throw new Error(result.error.message || 'Failed to send email');
    }
    return result;
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    console.error('Error sending email with Resend:', errorMessage);
    throw error;
  }
}

// Helper for password reset emails (for compatibility with existing code)
export async function sendPasswordResetEmail(to: string, resetUrl: string, name?: string) {
  const subject = 'Reset Your Password - Trek Hub India';
  const html = `
    <h1>Reset Your Password</h1>
    <p>Hi${name ? ` ${name}` : ''},</p>
    <p>We received a request to reset your password. Click the link below to set a new password:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p>If you did not request this, you can safely ignore this email.</p>
    <p>Thanks,<br/>Trek Hub India Team</p>
  `;
  try {
    await sendEmail({ to, subject, html });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    return { success: false, error: errorMessage };
  }
}

// For compatibility with existing imports
export async function sendActivationEmail(to: string, activationUrl: string, name?: string) {
  const subject = 'Activate Your Account - Trek Hub India';
  const html = `
    <h1>Activate Your Account</h1>
    <p>Hi${name ? ` ${name}` : ''},</p>
    <p>Thank you for signing up! Please activate your account by clicking the link below:</p>
    <p><a href="${activationUrl}">${activationUrl}</a></p>
    <p>If you did not sign up, you can safely ignore this email.</p>
    <p>Thanks,<br/>Trek Hub India Team</p>
  `;
  try {
    await sendEmail({ to, subject, html });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    return { success: false, error: errorMessage };
  }
}

// Send Q&A reply email with professional format
export async function sendQAReplyEmail({
  to,
  customerName,
  originalQuestion,
  adminReply,
  submissionDate
}: {
  to: string;
  customerName: string;
  originalQuestion: string;
  adminReply: string;
  submissionDate: string;
}) {
  console.log('📧 Attempting to send Q&A reply email...');
  console.log('   To:', to);
  console.log('   Customer:', customerName);
  console.log('   From:', resendFromEmail);
  console.log('   API Key present:', !!resendApiKey);
  
  const subject = 'Response to Your Inquiry - Trek Hub India';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Response to Your Inquiry</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .header p { margin: 5px 0 0 0; opacity: 0.9; font-size: 14px; }
        .content { padding: 30px 20px; }
        .greeting { font-size: 16px; margin-bottom: 20px; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 14px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        .question-box { background-color: #f8fafc; border-left: 4px solid #e2e8f0; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .question-text { color: #475569; font-style: italic; margin: 0; }
        .reply-box { background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; border-radius: 4px; }
        .reply-text { color: #1e293b; margin: 0; white-space: pre-line; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { margin: 5px 0; color: #64748b; font-size: 14px; }
        .contact-info { margin-top: 15px; }
        .contact-info a { color: #2563eb; text-decoration: none; }
        .contact-info a:hover { text-decoration: underline; }
        .signature { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏔️ Trek Hub India</h1>
          <p>Your Himalayan Adventure Specialists</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Dear ${customerName},
          </div>
          
          <p>Thank you for reaching out to Trek Hub India. We've carefully reviewed your inquiry and are pleased to provide you with a detailed response.</p>
          
          <div class="section">
            <div class="section-title">Your Original Question</div>
            <div class="question-box">
              <p class="question-text">"${originalQuestion}"</p>
              <small style="color: #64748b;">Submitted on ${new Date(submissionDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</small>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Our Response</div>
            <div class="reply-box">
              <p class="reply-text">${adminReply}</p>
            </div>
          </div>
          
          <div class="signature">
            <p>We hope this information helps you plan your perfect Himalayan adventure. If you have any additional questions or would like to proceed with a booking, please don't hesitate to contact us.</p>
            
            <p><strong>Best regards,</strong><br>
            The Trek Hub India Team</p>
          </div>
        </div>
        
        <div class="footer">
          <div class="contact-info">
            <p><strong>Contact Us</strong></p>
            <p>📞 <a href="tel:+919876543210">+91 98765 43210</a></p>
            <p>📧 <a href="mailto:info@trekhubindia.com">info@trekhubindia.com</a></p>
            <p>🌐 <a href="https://trekhubindia.com">www.trekhubindia.com</a></p>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #94a3b8;">
            Trek Hub India - Adventure Hub, Tapovan, Rishikesh, Uttarakhand 249192<br>
            This email was sent in response to your inquiry. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Dear ${customerName},

Thank you for reaching out to Trek Hub India. We've carefully reviewed your inquiry and are pleased to provide you with a detailed response.

YOUR ORIGINAL QUESTION:
"${originalQuestion}"
Submitted on ${new Date(submissionDate).toLocaleDateString()}

OUR RESPONSE:
${adminReply}

We hope this information helps you plan your perfect Himalayan adventure. If you have any additional questions or would like to proceed with a booking, please don't hesitate to contact us.

Best regards,
The Trek Hub India Team

Contact Us:
Phone: +91 98765 43210
Email: info@trekhubindia.com
Website: www.trekhubindia.com

Trek Hub India - Adventure Hub, Tapovan, Rishikesh, Uttarakhand 249192
  `;

  try {
    console.log('📤 Sending email via Resend...');
    const result = await sendEmail({ to, subject, html, text });
    console.log('✅ Email sent successfully via Resend:', result);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = (error as Error).message || String(error);
    console.error('❌ Resend email failed:', errorMessage);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
    
    return { success: false, error: errorMessage };
  }
}

// For compatibility with existing imports
export const emailService = { sendEmail, sendActivationEmail, sendPasswordResetEmail, sendQAReplyEmail }; 