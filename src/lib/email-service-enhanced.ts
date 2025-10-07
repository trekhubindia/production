import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

// Initialize Resend
let resend: Resend | null = null;
if (resendApiKey) {
  resend = new Resend(resendApiKey);
}

// Initialize Gmail transporter
let gmailTransporter: nodemailer.Transporter | null = null;
if (gmailUser && gmailPassword && gmailUser !== 'your_gmail_address@gmail.com') {
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });
}

export async function sendQAReplyEmailEnhanced({
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
  console.log('📧 Enhanced email service - attempting to send Q&A reply...');
  console.log('   To:', to);
  console.log('   Customer:', customerName);
  console.log('   Resend available:', !!resend);
  console.log('   Gmail available:', !!gmailTransporter);

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
            This email was sent in response to your inquiry.
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

  // Try Resend first
  if (resend && resendFromEmail) {
    try {
      console.log('📤 Attempting to send via Resend...');
      const result = await resend.emails.send({
        from: resendFromEmail,
        to: to,
        subject: subject,
        html: html,
        text: text,
      });

      if (result.error) {
        console.error('❌ Resend API error:', result.error);
        throw new Error(result.error.message || 'Resend API error');
      }

      console.log('✅ Email sent successfully via Resend:', result.data?.id);
      return { success: true, method: 'resend', id: result.data?.id };
    } catch (error) {
      console.error('❌ Resend failed:', error);
      // Continue to try Gmail
    }
  }

  // Try Gmail as fallback
  if (gmailTransporter) {
    try {
      console.log('📤 Attempting to send via Gmail...');
      const result = await gmailTransporter.sendMail({
        from: `"Trek Hub India" <${gmailUser}>`,
        to: to,
        subject: subject,
        html: html,
        text: text,
      });

      console.log('✅ Email sent successfully via Gmail:', result.messageId);
      return { success: true, method: 'gmail', id: result.messageId };
    } catch (error) {
      console.error('❌ Gmail failed:', error);
    }
  }

  // If both methods fail
  console.error('❌ All email methods failed');
  return { 
    success: false, 
    error: 'All email services failed. Please check your email configuration.',
    details: {
      resendAvailable: !!resend,
      gmailAvailable: !!gmailTransporter,
      resendFromEmail,
      gmailUser
    }
  };
}

export default sendQAReplyEmailEnhanced;
