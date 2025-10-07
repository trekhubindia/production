  import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface NewsletterEmailData {
  to: string;
  name?: string;
  blogTitle: string;
  blogSummary: string;
  blogUrl: string;
  unsubscribeUrl: string;
}

export async function sendBlogNotificationEmail({
  to,
  name,
  blogTitle,
  blogSummary,
  blogUrl,
  unsubscribeUrl
}: NewsletterEmailData) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Trek Hub India <onboarding@resend.dev>',
      to: [to],
      subject: `New Blog Post: ${blogTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Blog Post - ${blogTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .blog-preview { background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 30px 0; border-left: 4px solid #1a365d; }
            .cta-button { display: inline-block; background: #1a365d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
            .unsubscribe { color: #999; font-size: 12px; margin-top: 20px; }
            .unsubscribe a { color: #666; }
            @media (max-width: 600px) { .container { margin: 0; } .header, .content { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700;">🏔️ Trek Hub India</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Your Adventure Awaits</p>
            </div>

            <!-- Content -->
            <div class="content">
              <h2 style="color: #1a365d; margin-bottom: 10px;">Hi ${name || 'Fellow Adventurer'}! 👋</h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                We've just published a new blog post that we think you'll love! Get ready for your next adventure with our latest insights and tips.
              </p>

              <!-- Blog Preview -->
              <div class="blog-preview">
                <h3 style="color: #1a365d; margin: 0 0 15px 0; font-size: 22px; line-height: 1.3;">${blogTitle}</h3>
                <p style="margin: 0; color: #555; font-size: 16px; line-height: 1.6;">${blogSummary}</p>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${blogUrl}" class="cta-button" style="color: white;">Read Full Article →</a>
              </div>

              <div style="background: #e8f4f8; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="margin: 0; font-size: 14px; color: #1a365d;">
                  <strong>💡 Why you'll love this:</strong> Our expert guides share practical tips, safety advice, and insider secrets to make your trekking adventures unforgettable and safe.
                </p>
              </div>

              <p style="font-size: 16px; margin-top: 30px;">
                Happy trekking! 🥾<br>
                <strong>The Trek Hub India Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #1a365d;">Stay Connected</p>
              <p style="margin: 0 0 20px 0;">
                Follow us for more adventure tips and destination guides:<br>
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Website</a> |
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Instagram</a> |
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Facebook</a>
              </p>
              
              <div class="unsubscribe">
                <p style="margin: 0;">
                  You're receiving this because you subscribed to our newsletter.<br>
                  <a href="${unsubscribeUrl}">Unsubscribe</a> | 
                  <a href="${blogUrl}">View in browser</a>
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name || 'Fellow Adventurer'}!

We've just published a new blog post: ${blogTitle}

${blogSummary}

Read the full article: ${blogUrl}

Happy trekking!
The Trek Hub India Team

---
Unsubscribe: ${unsubscribeUrl}
      `.trim()
    });

    if (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

export async function sendWelcomeEmail(to: string, name?: string) {
  try {
    const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(to)}`;
    
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Trek Hub India <onboarding@resend.dev>',
      to: [to],
      subject: '🏔️ Welcome to Trek Hub India Newsletter!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Trek Hub India</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #1a365d 0%, #2d5a87 100%); color: white; padding: 40px 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .welcome-box { background: #e8f4f8; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; }
            .cta-button { display: inline-block; background: #1a365d; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #e9ecef; }
            .unsubscribe { color: #999; font-size: 12px; margin-top: 20px; }
            .unsubscribe a { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700;">🏔️ Welcome to Trek Hub India!</h1>
              <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Your Adventure Journey Starts Here</p>
            </div>

            <div class="content">
              <h2 style="color: #1a365d; margin-bottom: 20px;">Hi ${name || 'Fellow Adventurer'}! 👋</h2>
              
              <p style="font-size: 16px; margin-bottom: 25px;">
                Thank you for subscribing to our newsletter! We're thrilled to have you join our community of adventure seekers and mountain lovers.
              </p>

              <div class="welcome-box">
                <h3 style="color: #1a365d; margin: 0 0 20px 0;">🎒 What to Expect</h3>
                <ul style="text-align: left; margin: 0; padding-left: 20px; color: #555;">
                  <li style="margin-bottom: 10px;"><strong>Expert Trekking Guides:</strong> Detailed route information and insider tips</li>
                  <li style="margin-bottom: 10px;"><strong>Safety First:</strong> Essential safety advice and emergency preparedness</li>
                  <li style="margin-bottom: 10px;"><strong>Gear Reviews:</strong> Equipment recommendations from experienced guides</li>
                  <li style="margin-bottom: 10px;"><strong>Destination Insights:</strong> Hidden gems and seasonal recommendations</li>
                  <li><strong>Planning Tips:</strong> Budget advice, permits, and itinerary essentials</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 35px 0;">
                <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blogs" class="cta-button" style="color: white;">Explore Our Blog →</a>
              </div>

              <p style="font-size: 16px; margin-top: 30px; background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <strong>🌟 Pro Tip:</strong> Keep an eye out for our weekly adventure stories and seasonal trekking guides. We'll help you plan your next unforgettable journey!
              </p>

              <p style="font-size: 16px; margin-top: 30px;">
                Ready to explore the mountains? 🏔️<br>
                <strong>The Trek Hub India Team</strong>
              </p>
            </div>

            <div class="footer">
              <p style="margin: 0 0 15px 0; font-weight: 600; color: #1a365d;">Stay Connected</p>
              <p style="margin: 0 0 20px 0;">
                Follow us for daily adventure inspiration:<br>
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Website</a> |
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Instagram</a> |
                <a href="#" style="color: #1a365d; text-decoration: none; margin: 0 10px;">Facebook</a>
              </p>
              
              <div class="unsubscribe">
                <p style="margin: 0;">
                  <a href="${unsubscribeUrl}">Unsubscribe</a> from these emails at any time.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to Trek Hub India Newsletter!

Hi ${name || 'Fellow Adventurer'}!

Thank you for subscribing! We're excited to share our adventure expertise with you.

What to expect:
• Expert trekking guides and route information
• Essential safety advice and emergency tips
• Gear reviews and equipment recommendations  
• Hidden destination gems and seasonal guides
• Budget planning and permit information

Explore our blog: ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blogs

Ready for your next adventure?
The Trek Hub India Team

---
Unsubscribe: ${unsubscribeUrl}
      `.trim()
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Welcome email service error:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}
