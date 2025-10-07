import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBlogNotificationEmail } from '@/lib/email-newsletter';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { blogId, blogTitle, blogSummary, blogSlug } = body;

    if (!blogId || !blogTitle || !blogSummary || !blogSlug) {
      return NextResponse.json({ 
        error: 'Missing required fields: blogId, blogTitle, blogSummary, blogSlug' 
      }, { status: 400 });
    }

    // Get all active subscribers
    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from('blog_subscribers')
      .select('email, name')
      .eq('status', 'active')
      .eq('verified', true);

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscribers' 
      }, { status: 500 });
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ 
        message: 'No active subscribers found',
        sent: 0,
        failed: 0
      });
    }

    const blogUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blogs/${blogSlug}`;
    
    let sentCount = 0;
    let failedCount = 0;
    const failedEmails: string[] = [];

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
        
        const result = await sendBlogNotificationEmail({
          to: subscriber.email,
          name: subscriber.name,
          blogTitle,
          blogSummary,
          blogUrl,
          unsubscribeUrl
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          failedEmails.push(subscriber.email);
          console.error(`Failed to send to ${subscriber.email}:`, result.error);
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        failedCount++;
        failedEmails.push(subscriber.email);
        console.error(`Error sending to ${subscriber.email}:`, error);
      }
    }

    // Log the newsletter send event
    try {
      await supabaseAdmin
        .from('newsletter_logs')
        .insert({
          blog_id: blogId,
          blog_title: blogTitle,
          subscribers_count: subscribers.length,
          sent_count: sentCount,
          failed_count: failedCount,
          failed_emails: failedEmails,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.error('Failed to log newsletter send:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully`,
      totalSubscribers: subscribers.length,
      sent: sentCount,
      failed: failedCount,
      failedEmails: failedEmails.length > 0 ? failedEmails : undefined
    });

  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
